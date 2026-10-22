
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "./address.schema";

export const createAddress = async (
  userId: string,
  input: CreateAddressInput
) => {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: input.label ?? null,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country,
        isDefault: input.isDefault,
      },
    });
  });
};

export const getAddresses = async (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
};

export const getAddressById = async (
  userId: string,
  addressId: string
) => {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  return address;
};

export const updateAddress = async (
  userId: string,
  addressId: string,
  input: UpdateAddressInput
) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }

    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: input,
    });
  });
};

export const deleteAddress = async (
  userId: string,
  addressId: string
) => {
  const existing = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  return { id: addressId };
};
