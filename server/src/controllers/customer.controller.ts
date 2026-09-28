import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatar: z.string().max(2_000_000).nullable().optional(),
  preference: z.enum(["DELIVERY", "PICKUP"]).optional(),
});

const addressSchema = z.object({
  label: z.string().min(1).default("Casa"),
  recipientName: z.string().optional(),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  zip: z.string().min(8),
  isDefault: z.boolean().optional(),
});

const petSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["cachorro", "gato"]),
  breed: z.string().default(""),
  size: z.enum(["pequeno", "medio", "grande", "todos"]).default("todos"),
  age: z.string().default(""),
  weight: z.string().default(""),
  restrictions: z.string().optional(),
  notes: z.string().optional(),
});

function userId(req: Request) {
  if (!req.user?.userId) throw new AppError("Não autenticado", 401);
  return req.user.userId;
}

export async function updateCustomerProfile(req: Request, res: Response) {
  const data = profileSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: userId(req) },
    data: {
      ...data,
      ...(data.phone !== undefined && { phone: data.phone.replace(/\D/g, "") }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      preference: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(updated);
}

export async function listAddresses(req: Request, res: Response) {
  const addresses = await prisma.address.findMany({
    where: { userId: userId(req) },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json(addresses);
}

export async function createAddress(req: Request, res: Response) {
  const data = addressSchema.parse(req.body);
  const uid = userId(req);

  const count = await prisma.address.count({ where: { userId: uid } });
  const makeDefault = data.isDefault === true || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId: uid },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: uid,
        label: data.label,
        recipientName: data.recipientName,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state.toUpperCase(),
        zip: data.zip.replace(/\D/g, ""),
        isDefault: makeDefault,
      },
    });
  });

  res.status(201).json(address);
}

export async function updateAddress(req: Request, res: Response) {
  const data = addressSchema.partial().parse(req.body);
  const uid = userId(req);
  const current = await prisma.address.findFirst({
    where: { id: req.params.id, userId: uid },
  });
  if (!current) throw new AppError("Endereço não encontrado", 404);

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault === true) {
      await tx.address.updateMany({
        where: { userId: uid, id: { not: current.id } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id: current.id },
      data: {
        ...data,
        ...(data.state !== undefined && { state: data.state.toUpperCase() }),
        ...(data.zip !== undefined && { zip: data.zip.replace(/\D/g, "") }),
      },
    });
  });

  res.json(updated);
}

export async function deleteAddress(req: Request, res: Response) {
  const uid = userId(req);
  const current = await prisma.address.findFirst({
    where: { id: req.params.id, userId: uid },
  });
  if (!current) throw new AppError("Endereço não encontrado", 404);

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: current.id } });
    if (current.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });

  res.json({ message: "Endereço removido" });
}

export async function listPets(req: Request, res: Response) {
  const pets = await prisma.pet.findMany({
    where: { userId: userId(req) },
    orderBy: { createdAt: "asc" },
  });
  res.json(pets);
}

export async function createPet(req: Request, res: Response) {
  const data = petSchema.parse(req.body);
  const pet = await prisma.pet.create({
    data: { ...data, userId: userId(req) },
  });
  res.status(201).json(pet);
}

export async function updatePet(req: Request, res: Response) {
  const uid = userId(req);
  const current = await prisma.pet.findFirst({
    where: { id: req.params.id, userId: uid },
  });
  if (!current) throw new AppError("Pet não encontrado", 404);

  const data = petSchema.partial().parse(req.body);
  const pet = await prisma.pet.update({
    where: { id: current.id },
    data,
  });
  res.json(pet);
}

export async function deletePet(req: Request, res: Response) {
  const uid = userId(req);
  const current = await prisma.pet.findFirst({
    where: { id: req.params.id, userId: uid },
  });
  if (!current) throw new AppError("Pet não encontrado", 404);

  await prisma.pet.delete({ where: { id: current.id } });
  res.json({ message: "Pet removido" });
}

export async function listCustomerOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: userId(req) },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  res.json(orders);
}


export async function listWishlist(req: Request, res: Response) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: userId(req) },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  res.json(items.map((item) => item.productId));
}

export async function addWishlistItem(req: Request, res: Response) {
  const uid = userId(req);
  const product = await prisma.product.findFirst({
    where: { id: req.params.productId, active: true },
    select: { id: true },
  });
  if (!product) throw new AppError("Produto não encontrado", 404);

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: uid,
        productId: product.id,
      },
    },
    update: {},
    create: {
      userId: uid,
      productId: product.id,
    },
  });

  res.status(201).json({ productId: product.id });
}

export async function removeWishlistItem(req: Request, res: Response) {
  const uid = userId(req);
  await prisma.wishlistItem.deleteMany({
    where: { userId: uid, productId: req.params.productId },
  });
  res.json({ message: "Favorito removido" });
}

export async function clearWishlist(req: Request, res: Response) {
  const uid = userId(req);
  await prisma.wishlistItem.deleteMany({ where: { userId: uid } });
  res.json({ message: "Favoritos limpos" });
}
