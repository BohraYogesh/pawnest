
import type { Request, Response } from "express";
import * as categoriesService from "./categories.service";

export async function listCategories(_req: Request, res: Response) {
  const categories = await categoriesService.getCategories();

  res.status(200).json({
    success: true,
    data: categories,
  });
}

export async function getCategory(req: Request, res: Response) {
  const category = await categoriesService.getCategoryBySlug(
    req.params.slug as string,
  );

  res.status(200).json({
    success: true,
    data: category,
  });
}

export async function createCategory(req: Request, res: Response) {
  const category = await categoriesService.createCategory(
    req.body,
    req.user!.id,
  );

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
}

export async function updateCategory(req: Request, res: Response) {
  const category = await categoriesService.updateCategory(
    req.params.id as string,
    req.body,
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
}

export async function deleteCategory(req: Request, res: Response) {
  const result = await categoriesService.deleteCategory(
    req.params.id as string,
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}
