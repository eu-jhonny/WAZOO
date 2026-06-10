import { Router } from "express";
import multer from "multer";
import { uploadImage, deleteImage } from "../lib/cloudinary";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";

export const uploadRouter = Router();

// Multer → memória (envia para Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Apenas imagens são permitidas", 400));
    }
    cb(null, true);
  },
});

// Upload de imagem
uploadRouter.post(
  "/",
  authenticate,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) throw new AppError("Nenhum arquivo enviado", 400);
    const folder = String(req.body.folder ?? "wazoo");
    const result = await uploadImage(req.file.buffer, folder);
    res.json(result);
  }
);

// Upload múltiplo
uploadRouter.post(
  "/multiple",
  authenticate,
  requireAdmin,
  upload.array("images", 10),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new AppError("Nenhum arquivo enviado", 400);
    const folder = String(req.body.folder ?? "wazoo");
    const results = await Promise.all(files.map((f) => uploadImage(f.buffer, folder)));
    res.json(results);
  }
);

// Deletar imagem
uploadRouter.delete("/", authenticate, requireAdmin, async (req, res) => {
  const { publicId } = z.object({ publicId: z.string() }).parse(req.body);
  await deleteImage(publicId);
  res.json({ message: "Imagem excluída" });
});
