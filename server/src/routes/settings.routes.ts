import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

// Listar todas as configurações (público — sem senhas)
settingsRouter.get("/", async (_req, res) => {
  const settings = await prisma.setting.findMany();
  // Transforma array [{key,value}] em objeto {key: value}
  const obj = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  res.json(obj);
});

// Atualizar configurações (admin)
settingsRouter.put("/", authenticate, requireAdmin, async (req, res) => {
  const schema = z.record(z.string(), z.string());
  const data = schema.parse(req.body);

  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  res.json({ message: "Configurações salvas", data });
});
