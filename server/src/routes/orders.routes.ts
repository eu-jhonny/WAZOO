import { Router } from "express";
import { createOrder, listOrders, getOrder, updateOrderStatus, validateCoupon, cancelOrder } from "../controllers/orders.controller";
import { authenticate, requireAdmin } from "../middleware/auth";

export const ordersRouter = Router();

ordersRouter.post("/",                      createOrder);          // público
ordersRouter.post("/validate-coupon",       validateCoupon);       // público
ordersRouter.get("/",   authenticate, requireAdmin, listOrders);
ordersRouter.get("/:id",                    getOrder);             // público (por número do pedido)
ordersRouter.put("/:id/status", authenticate, requireAdmin, updateOrderStatus);
ordersRouter.patch("/:id/cancel",               cancelOrder);          // cancelar pedido pendente
