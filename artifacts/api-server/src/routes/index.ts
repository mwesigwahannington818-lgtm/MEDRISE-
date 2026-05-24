import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./appointments";
import adminRouter from "./admin";
import patientsRouter from "./patients";
import staffRouter from "./staff";
import attendanceRouter from "./attendance";
import consultationsRouter from "./consultations";
import vitalsRouter from "./vitals";
import billingRouter from "./billing";
import pharmacyRouter from "./pharmacy";
import labRouter from "./lab";
import schedulesRouter from "./schedules";
import reportsRouter from "./reports";
import auditLogsRouter from "./auditLogs";
import queueRouter from "./queue";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(appointmentsRouter);
router.use(adminRouter);
router.use(patientsRouter);
router.use(staffRouter);
router.use(attendanceRouter);
router.use(consultationsRouter);
router.use(vitalsRouter);
router.use(billingRouter);
router.use(pharmacyRouter);
router.use(labRouter);
router.use(schedulesRouter);
router.use(reportsRouter);
router.use(auditLogsRouter);
router.use(queueRouter);
router.use(feedbackRouter);

export default router;
