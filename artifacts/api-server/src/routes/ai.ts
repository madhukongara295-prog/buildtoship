import OpenAI from "openai";
import {
  ClassifyWasteBody,
  ClassifyWasteResponse,
  EstimatePriceBody,
  EstimatePriceResponse,
} from "@workspace/api-zod";
import { aiAnalysesTable, db } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import { findCurrentProfile, requireClerkUser } from "../lib/auth";

const router: IRouter = Router();
const allowedImage = /^data:image\/(jpeg|png|webp);base64,/i;

type ClassificationResult = {
  wasteType: string;
  confidence: number;
  description: string;
  possibleUses: string[];
  alternatives: string[];
  mode: "ai" | "demo";
};

function validClassification(value: unknown): value is {
  wasteType: string;
  confidence: number;
  description: string;
  possibleUses: string[];
  alternatives: string[];
} {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.wasteType === "string" &&
    typeof data.confidence === "number" &&
    typeof data.description === "string" &&
    Array.isArray(data.possibleUses) &&
    data.possibleUses.every((item) => typeof item === "string") &&
    Array.isArray(data.alternatives) &&
    data.alternatives.every((item) => typeof item === "string");
}

function demoClassification(): ClassificationResult {
  return {
    wasteType: "Mixed agricultural residue",
    confidence: 0.62,
    description: "A demo result. Confirm the crop residue type and quality before publishing.",
    possibleUses: ["Composting", "Biomass fuel", "Animal bedding"],
    alternatives: ["Rice straw", "Wheat straw", "Sugarcane bagasse"],
    mode: "demo",
  };
}

const basePricePerTon: Record<string, number> = {
  "rice straw": 3800,
  "paddy straw": 3800,
  "wheat straw": 4700,
  "sugarcane bagasse": 3200,
  bagasse: 3200,
  "cotton stalk": 5200,
  "corn stover": 5600,
  "maize stalk": 5200,
  "coconut husk": 6200,
  "groundnut shell": 6800,
  "mustard straw": 4200,
};

function perUnitPrice(wasteType: string, unit: string): number {
  const key = wasteType.toLowerCase().trim();
  const perTon = basePricePerTon[key] ??
    Object.entries(basePricePerTon).find(([name]) => key.includes(name))?.[1] ??
    4500;
  const multiplier = unit === "kg" ? 1 / 1000 : unit === "quintal" ? 1 / 10 : 1;
  return Math.round(perTon * multiplier);
}

router.post(
  "/ai/classify-waste",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const body = ClassifyWasteBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    if (
      body.data.imageData.length > 20_000_000 ||
      !allowedImage.test(body.data.imageData)
    ) {
      res.status(400).json({
        error: "Upload a JPEG, PNG, or WebP photo under 15 MB.",
      });
      return;
    }

    let result: ClassificationResult = demoClassification();
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          response_format: { type: "json_object" },
          max_completion_tokens: 450,
          messages: [
            {
              role: "system",
              content:
                "Classify the agricultural plant material in the image for a farmer marketplace. Return JSON only with wasteType, confidence (0 to 1), a short plain-language description, 2 to 4 possibleUses, and up to 3 alternatives. If it is not clearly agricultural residue, say so in the description and lower confidence. Never claim an image proves quality or safety.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify this crop residue." },
                {
                  type: "image_url",
                  image_url: { url: body.data.imageData, detail: "low" },
                },
              ],
            },
          ],
        });
        const text = completion.choices[0]?.message?.content;
        const parsed: unknown = text ? JSON.parse(text) : null;
        if (validClassification(parsed)) {
          result = {
            wasteType: parsed.wasteType,
            confidence: Math.max(0, Math.min(1, parsed.confidence)),
            description: parsed.description,
            possibleUses: parsed.possibleUses.slice(0, 4),
            alternatives: parsed.alternatives.slice(0, 3),
            mode: "ai",
          };
        }
      } catch (error) {
        req.log.warn(
          { message: error instanceof Error ? error.message : "Unknown AI error" },
          "AI classification unavailable; returning demo guidance",
        );
      }
    }

    const profile = await findCurrentProfile(req);
    if (profile) {
      await db.insert(aiAnalysesTable).values({
        profileId: profile.id,
        wasteType: result.wasteType,
        confidence: result.confidence,
        mode: result.mode,
        result,
      });
    }
    res.json(ClassifyWasteResponse.parse(result));
  },
);

router.post(
  "/ai/price-estimate",
  requireClerkUser,
  async (req: Request, res: Response): Promise<void> => {
    const body = EstimatePriceBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const fallbackPrice = perUnitPrice(body.data.wasteType, body.data.unit);
    const rangeLow = Math.max(1, Math.round(fallbackPrice * 0.78));
    const rangeHigh = Math.max(rangeLow + 1, Math.round(fallbackPrice * 1.28));
    let result: {
      minimumPrice: number;
      maximumPrice: number;
      suggestedPrice: number;
      explanation: string;
      disclaimer: string;
      mode: "ai" | "demo";
    } = {
      minimumPrice: rangeLow,
      maximumPrice: rangeHigh,
      suggestedPrice: fallbackPrice,
      explanation: `A starting estimate for ${body.data.wasteType} in ${body.data.location}, based on a broad residue benchmark.`,
      disclaimer: "Indicative only. Confirm current local demand, moisture, cleanliness, and transport costs before agreeing a price.",
      mode: "demo",
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          response_format: { type: "json_object" },
          max_completion_tokens: 320,
          messages: [
            {
              role: "system",
              content:
                "Suggest a cautious indicative Indian rupee price for agricultural residue. Return JSON only: minimumPrice, maximumPrice, suggestedPrice (all numeric INR for the exact requested unit), and explanation (one sentence). Use the reference price as a rough baseline, account for quality and location only modestly, and never imply live market data. Keep the suggested price inside the range.",
            },
            {
              role: "user",
              content: JSON.stringify({
                wasteType: body.data.wasteType,
                quantity: body.data.quantity,
                unit: body.data.unit,
                location: body.data.location,
                quality: body.data.quality ?? "not specified",
                broadReferencePricePerUnit: fallbackPrice,
              }),
            },
          ],
        });
        const text = completion.choices[0]?.message?.content;
        const parsed: unknown = text ? JSON.parse(text) : null;
        if (parsed && typeof parsed === "object") {
          const values = parsed as Record<string, unknown>;
          const low = Number(values.minimumPrice);
          const high = Number(values.maximumPrice);
          const suggested = Number(values.suggestedPrice);
          if (
            Number.isFinite(low) &&
            Number.isFinite(high) &&
            Number.isFinite(suggested) &&
            low >= 0 &&
            high >= low &&
            typeof values.explanation === "string"
          ) {
            result = {
              minimumPrice: low,
              maximumPrice: high,
              suggestedPrice: Math.max(low, Math.min(high, suggested)),
              explanation: values.explanation,
              disclaimer: "AI-assisted estimate, not a live quote. Verify local demand, quality, and transport costs before agreeing a price.",
              mode: "ai",
            };
          }
        }
      } catch (error) {
        req.log.warn(
          { message: error instanceof Error ? error.message : "Unknown AI error" },
          "AI price estimate unavailable; returning a benchmark range",
        );
      }
    }

    res.json(EstimatePriceResponse.parse(result));
  },
);

export default router;
