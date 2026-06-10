import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

export const newsletterRouter = Router();

newsletterRouter.post("/subscribe", async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email },
  });
  res.json({ message: "Inscrito com sucesso!" });
});

newsletterRouter.get("/", authenticate, requireAdmin, async (_req, res) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(subscribers);
});

newsletterRouter.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  await prisma.newsletterSubscriber.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.json({ message: "Inscrito removido" });
});
