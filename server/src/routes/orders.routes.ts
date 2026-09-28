import { Router } from "express";
import { createOrder, listOrders, getOrder, trackOrder, updateOrderStatus, validateCoupon, cancelOrder } from "../controllers/orders.controller";
import { authenticate, optionalAuthenticate, requireAdmin } from "../middleware/auth";

export const ordersRouter = Router();

ordersRouter.post("/", optionalAuthenticate, createOrder);          // público
ordersRouter.post("/validate-coupon",       validateCoupon);       // público
ordersRouter.get("/",   authenticate, requireAdmin, listOrders);
ordersRouter.get("/track/:number",          trackOrder);           // público, resposta sem dados pessoais
ordersRouter.get("/:id", authenticate, requireAdmin, getOrder);
ordersRouter.put("/:id/status", authenticate, requireAdmin, updateOrderStatus);
ordersRouter.patch("/:id/cancel", authenticate, requireAdmin, cancelOrder);          // cancelar pedido pendente
