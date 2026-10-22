
import type { Request, Response } from "express";
import * as productsService from "./products.service";
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from "./products.schema";

export async function listProducts(req: Request, res: Response) {
  const query = listProductsSchema.parse(req.query);
  const result = await productsService.listProducts(query);

  res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getProduct(req: Request, res: Response) {
  const product = await productsService.getProductById(
    req.params.id as string
  );

  res.status(200).json({ success: true, data: product });
}

export async function getProductBySlug(req: Request, res: Response) {
  const product = await productsService.getProductBySlug(
    req.params.slug as string
  );

  res.status(200).json({ success: true, data: product });
}


export async function createProduct(req: Request, res: Response) {
  const body = createProductSchema.parse(req.body);

  const product = await productsService.createProduct(
    body,
    req.user!.id,
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
}



export async function updateProduct(req: Request, res: Response) {
  const body = updateProductSchema.parse(req.body);

  const product = await productsService.updateProduct(
    req.params.id as string,
    body,
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
}



export async function deleteProduct(req: Request, res: Response) {
  const result = await productsService.deleteProduct(
    req.params.id as string,
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
}

