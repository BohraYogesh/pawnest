
import type { Request, Response } from "express";
import * as settingsService from "./settings.service";
import { updateSettingsSchema } from "./settings.schema";

export async function getSettings(
  _req: Request,
  res: Response,
) {
  const settings = await settingsService.getGeneralSettings();

  res.status(200).json({
    success: true,
    message: "General settings fetched successfully",
    data: {
      ...settings,
      currency: "INR",
    },
  });
}

export async function updateSettings(
  req: Request,
  res: Response,
) {
  const parsed = updateSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid settings information",
      errors: parsed.error.flatten(),
    });
    return;
  }

  // Get the logged-in admin's ID
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  // Update settings and record the admin activity
  const settings = await settingsService.updateGeneralSettings(
    parsed.data,
    userId,
  );

  res.status(200).json({
    success: true,
    message: "General settings updated successfully",
    data: {
      ...settings,
      currency: "INR",
    },
  });
}
