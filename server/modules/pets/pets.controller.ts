import { Request, Response } from "express";
import {
  createPet as createPetService,
  getMyPets,
  getPetById,
  updatePet as updatePetService,
  deletePet as deletePetService,
} from "./pets.service";

export async function createPet(req: Request, res: Response) {
  const pet = await createPetService(req.user!.id, req.body);

  res.status(201).json({
    success: true,
    data: { pet },
  });
}

export async function listPets(req: Request, res: Response) {
  const pets = await getMyPets(req.user!.id);

  res.json({
    success: true,
    data: { pets },
  });
}

export async function getPet(req: Request, res: Response) {
  const pet = await getPetById(req.user!.id, req.params.id as string);
  res.json({
    success: true,
    data: { pet },
  });
}

export async function updatePet(req: Request, res: Response) {
  const pet = await updatePetService(req.user!.id, req.params.id as string, req.body);

  res.json({
    success: true,
    data: { pet },
  });
}

export async function deletePet(req: Request, res: Response) {
  await deletePetService(req.user!.id, req.params.id as string);

  res.json({
    success: true,
    message: "Pet deleted successfully",
  });
}
