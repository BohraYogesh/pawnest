
import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";

export const summary = async (_req: Request, res: Response) => {
  const data = await dashboardService.getDashboardSummary();

  res.status(200).json({
    success: true,
    message: "Dashboard summary fetched successfully",
    data,
  });
};

export const recentOrders = async (_req: Request, res: Response) => {
  const data = await dashboardService.getRecentOrders();

  res.status(200).json({
    success: true,
    message: "Recent orders fetched successfully",
    data,
  });
};

export const topProducts = async (_req: Request, res: Response) => {
  const data = await dashboardService.getTopProducts();

  res.status(200).json({
    success: true,
    message: "Top products fetched successfully",
    data,
  });
};
