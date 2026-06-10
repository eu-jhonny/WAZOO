import { Router } from "express";
import { processPayment, paymentWebhook, getPaymentStatus } from "../controllers/payments.controller";

export const paymentsRouter = Router();

paymentsRouter.post("/process",          processPayment);
paymentsRouter.post("/webhook",          paymentWebhook);  // chamado pelo MercadoPago
paymentsRouter.get("/status/:orderId",   getPaymentStatus);
