
import type { Request, Response } from "express";
import * as profileService from "./profile.service";
import { updateProfileSchema } from "./profile.schema";

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getAdminProfile(req.user!.id);

  res.status(200).json({
    success: true,
    message: "Admin profile fetched successfully",
    data: profile,
  });
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid profile information",
      errors: parsed.error.flatten(),
    });
    return;
  }

  const profile = await profileService.updateAdminProfile(
    req.user!.id,
    parsed.data,
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: profile,
  });
}

export async function getRecentActivity(req: Request, res: Response) {
  const activities = await profileService.getRecentAdminActivity(
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    message: "Recent activity fetched successfully",
    data: activities,
  });
}

export async function updateProfileAvatar(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "Please select an image to upload",
    });
    return;
  }

  const profile = await profileService.uploadAdminAvatar(
    req.user!.id,
    req.file.buffer,
  );

  res.status(200).json({
    success: true,
    message: "Profile photo updated successfully",
    data: profile,
  });
}
