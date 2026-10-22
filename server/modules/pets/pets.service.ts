
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { CreatePetInput, UpdatePetInput } from "./pets.schema";

export async function createPet(userId: string, input: CreatePetInput) {
  return prisma.pet.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      breed: input.breed,
      birthDate: input.birthDate,
      weightKg: input.weightKg,
      photoUrl: input.photoUrl,
    },
  });
}

export async function getMyPets(userId: string) {
  return prisma.pet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPetById(userId: string, petId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId },
  });

  if (!pet) {
    throw new ApiError(404, "PET_NOT_FOUND", "Pet not found");
  }

  return pet;
}

export async function updatePet(
  userId: string,
  petId: string,
  input: UpdatePetInput
) {
  const existingPet = await prisma.pet.findFirst({
    where: { id: petId, userId },
    select: { id: true },
  });

  if (!existingPet) {
    throw new ApiError(404, "PET_NOT_FOUND", "Pet not found");
  }

  return prisma.pet.update({
    where: { id: existingPet.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.breed !== undefined && { breed: input.breed }),
      ...(input.birthDate !== undefined && {
        birthDate: input.birthDate,
      }),
      ...(input.weightKg !== undefined && {
        weightKg: input.weightKg,
      }),
      ...(input.photoUrl !== undefined && {
        photoUrl: input.photoUrl,
      }),
    },
  });
}

export async function deletePet(userId: string, petId: string) {
  const result = await prisma.pet.deleteMany({
    where: { id: petId, userId },
  });

  if (result.count === 0) {
    throw new ApiError(404, "PET_NOT_FOUND", "Pet not found");
  }
}
