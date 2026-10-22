
import type { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service";
import {
  demoPaymentSchema,
  paymentOrderIdSchema,
} from "./payments.schema";

export const processDemoPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({
        success: false,
        message: "Demo payments are disabled in production",
      });
      return;
    }

    const { id } = paymentOrderIdSchema.parse(req.params);
    const input = demoPaymentSchema.parse(req.body);

    const order = await paymentsService.processDemoPayment(
      req.user!.id,
      id,
      input
    );

    res.status(200).json({
      success: true,
      message:
        input.result === "SUCCESS"
          ? "Demo payment successful"
          : "Demo payment failed",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderPaymentStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = paymentOrderIdSchema.parse(req.params);

    const payment = await paymentsService.getOrderPaymentStatus(
      req.user!.id,
      id
    );

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
