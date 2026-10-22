import type { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";
import { listUsersSchema, updateUserStatusSchema } from "./users.schema";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listUsersSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid users filters",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const data = await usersService.listUsers(parsed.data);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function details(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.userId ?? "");

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const user = await usersService.getUserDetails(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = String(req.params.userId ?? "");
    const parsed = updateUserStatusSchema.safeParse(req.body);

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid user status",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const user = await usersService.updateUserStatus(
      userId,
      parsed.data.status,
      req.user!.id,
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${user.status}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
