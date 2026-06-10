import { Router } from "express";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/products.controller";
import { authenticate, requireAdmin } from "../middleware/auth";

export const productsRouter = Router();

productsRouter.get("/",       listProducts);
productsRouter.get("/:id",    getProduct);
productsRouter.post("/",      authenticate, requireAdmin, createProduct);
productsRouter.put("/:id",    authenticate, requireAdmin, updateProduct);
productsRouter.delete("/:id", authenticate, requireAdmin, deleteProduct);
