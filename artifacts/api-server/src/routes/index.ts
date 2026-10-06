import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import commerceRouter from "./commerce";
import listingsRouter from "./listings";
import profilesRouter from "./profiles";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(listingsRouter);
router.use(commerceRouter);
router.use(aiRouter);
router.use(storageRouter);

export default router;
