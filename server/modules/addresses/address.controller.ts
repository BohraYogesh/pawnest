
import type { Request, Response } from "express";
import {
  addressIdSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./address.schema";
import * as addressService from "./address.service";

export const create = async (req: Request, res: Response) => {
  const input = createAddressSchema.parse(req.body);

  const address = await addressService.createAddress(
    req.user!.id,
    input
  );

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: address,
  });
};

export const list = async (req: Request, res: Response) => {
  const addresses = await addressService.getAddresses(req.user!.id);

  res.status(200).json({
    success: true,
    data: addresses,
  });
};

export const getById = async (req: Request, res: Response) => {
  const { id } = addressIdSchema.parse(req.params);

  const address = await addressService.getAddressById(
    req.user!.id,
    id
  );

  res.status(200).json({
    success: true,
    data: address,
  });
};

export const update = async (req: Request, res: Response) => {
  const { id } = addressIdSchema.parse(req.params);
  const input = updateAddressSchema.parse(req.body);

  const address = await addressService.updateAddress(
    req.user!.id,
    id,
    input
  );

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: address,
  });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = addressIdSchema.parse(req.params);

  const result = await addressService.deleteAddress(
    req.user!.id,
    id
  );

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    data: result,
  });
};
