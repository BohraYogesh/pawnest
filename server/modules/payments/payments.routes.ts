
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import {
  processDemoPaymentController,
  getOrderPaymentStatusController,
} from "./payments.controller";

const paymentsRoutes = Router();

paymentsRoutes.use(authenticate);

paymentsRoutes.post(
  "/orders/:id/pay",
  processDemoPaymentController
);

paymentsRoutes.get(
  "/orders/:id/payment",
  getOrderPaymentStatusController
);

export default paymentsRoutes;
