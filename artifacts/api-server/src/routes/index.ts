import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import postingsRouter from "./postings";
import applicationsRouter from "./applications";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(postingsRouter);
router.use(applicationsRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);

export default router;
