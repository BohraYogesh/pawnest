import type { Request, Response, NextFunction } from "express";
import * as reviewsService from "./reviews.service";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  productReviewParamsSchema,
  updateReviewStatusSchema,
} from "./reviews.schema";

export const createReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = productReviewParamsSchema.parse(req.params);
    const input = createReviewSchema.parse(req.body);

    const review = await reviewsService.createReview(
      req.user!.id,
      productId,
      input,
    );

    res.status(201).json({
      success: true,
      message: "Review submitted for moderation",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = productReviewParamsSchema.parse(req.params);
    const reviews = await reviewsService.getApprovedProductReviews(productId);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await reviewsService.getMyReviews(req.user!.id);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = reviewIdSchema.parse(req.params);
    const input = updateReviewSchema.parse(req.body);

    const review = await reviewsService.updateMyReview(req.user!.id, id, input);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMyReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = reviewIdSchema.parse(req.params);
    const result = await reviewsService.deleteMyReview(req.user!.id, id);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await reviewsService.getAllReviews();

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = reviewIdSchema.parse(req.params);
    const input = updateReviewStatusSchema.parse(req.body);

    const review = await reviewsService.updateReviewStatus(
      id,
      input,
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      message: "Review status updated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
