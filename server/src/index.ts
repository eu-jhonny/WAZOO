import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { expireStaleOrderReservations } from "./lib/orderInventory";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

/* ── Segurança ──────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

/* ── CORS ───────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origem não permitida: ${origin}`));
  },
  credentials: true,
}));

/* ── Parsing ────────────────────────────────────────── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Log ────────────────────────────────────────────── */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

/* ── Rotas ──────────────────────────────────────────── */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.use("/api", router);

/* ── 404 ────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

/* ── Handler de erros ───────────────────────────────── */
app.use(errorHandler);

/* ── Inicialização ──────────────────────────────────── */
const reservationSweep = async () => {
  try {
    const expired = await expireStaleOrderReservations();
    if (expired > 0) console.log(`[Pedidos] ${expired} reserva(s) expirada(s) e estoque devolvido.`);
  } catch (error) {
    console.error("[Pedidos] Erro ao expirar reservas:", error);
  }
};

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  🐾  Wazoo API rodando               ║
  ║  📡  http://localhost:${PORT}           ║
  ║  🌍  Ambiente: ${process.env.NODE_ENV ?? "development"}         ║
  ╚═══════════════════════════════════════╝
  `);

  void reservationSweep();
  const timer = setInterval(() => void reservationSweep(), 5 * 60 * 1000);
  timer.unref();
});

export default app;
