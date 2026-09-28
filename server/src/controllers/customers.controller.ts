import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function listCustomers(req: Request, res: Response) {
  const { search, page = "1", limit = "50" } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
  const take = parseInt(String(limit));

  const where = {
    role: "CUSTOMER" as const,
    ...(search
      ? {
          OR: [
            { name: { contains: String(search), mode: "insensitive" as const } },
            { email: { contains: String(search), mode: "insensitive" as const } },
            { phone: { contains: String(search), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        preference: true,
        active: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          take: 3,
        },
        pets: {
          orderBy: { createdAt: "asc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true, pets: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const customerIds = customers.map((customer) => customer.id);
  const paidTotals = customerIds.length
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: {
          userId: { in: customerIds },
          paymentStatus: "APPROVED",
        },
        _sum: { total: true },
      })
    : [];
  const totalByCustomer = new Map(
    paidTotals.map((row) => [row.userId, row._sum.total ?? 0]),
  );

  res.json({
    data: customers.map((customer) => ({
      ...customer,
      totalSpent: totalByCustomer.get(customer.id) ?? 0,
    })),
    total,
    page: parseInt(String(page)),
    pages: Math.ceil(total / take),
  });
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.user.findFirst({
    where: { id: req.params.id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      preference: true,
      active: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      pets: { orderBy: { createdAt: "asc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!customer) throw new AppError("Cliente não encontrado", 404);
  res.json(customer);
}

export async function setCustomerActive(req: Request, res: Response) {
  const active = req.body?.active;
  if (typeof active !== "boolean") {
    throw new AppError("Informe active como booleano", 400);
  }

  const customer = await prisma.user.findFirst({
    where: { id: req.params.id, role: "CUSTOMER" },
  });
  if (!customer) throw new AppError("Cliente não encontrado", 404);

  const updated = await prisma.user.update({
    where: { id: customer.id },
    data: { active },
    select: { id: true, active: true },
  });

  res.json(updated);
}
