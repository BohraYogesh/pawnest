
import type { Request, Response } from "express";
import cloudinary from "../../../config/cloudinary";
import {
  uploadImageSchema,
  updateImageSchema,
} from "./images.schema";
import * as imageService from "./images.service";

export const create = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "Please select an image file.",
    });
    return;
  }

  const input = uploadImageSchema.parse({
    position:
      req.body.position === undefined ? 0 : Number(req.body.position),
  });

  const uploadedImage = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "pawnest/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload failed."));
            return;
          }

          resolve({ secure_url: result.secure_url });
        }
      );

      stream.end(req.file!.buffer);
    }
  );

  const image = await imageService.createProductImage(
    req.params.id as string,
    {
      url: uploadedImage.secure_url,
      position: input.position,
    }
  );

  res.status(201).json({
    success: true,
    message: "Product image uploaded successfully",
    data: image,
  });
};

export const list = async (req: Request, res: Response) => {
  const images = await imageService.getProductImages(
    req.params.id as string
  );

  res.status(200).json({ success: true, data: images });
};

export const update = async (req: Request, res: Response) => {
  const input = updateImageSchema.parse(req.body);

  const image = await imageService.updateProductImage(
    req.params.id as string,
    req.params.imageId as string,
    input
  );

  res.status(200).json({
    success: true,
    message: "Image position updated successfully",
    data: image,
  });
};

export const remove = async (req: Request, res: Response) => {
  const result = await imageService.deleteProductImage(
    req.params.id as string,
    req.params.imageId as string
  );

  res.status(200).json({
    success: true,
    message: "Product image deleted successfully",
    data: result,
  });
};
