import { Router } from "express";
import { authRouter } from "./auth.routes";
import { productsRouter } from "./products.routes";
import { kitsRouter } from "./kits.routes";
import { ordersRouter } from "./orders.routes";
import { paymentsRouter } from "./payments.routes";
import { reviewsRouter } from "./reviews.routes";
import { couponsRouter } from "./coupons.routes";
import { bannersRouter } from "./banners.routes";
import { settingsRouter } from "./settings.routes";
import { uploadRouter } from "./upload.routes";
import { newsletterRouter } from "./newsletter.routes";

export const router = Router();

router.use("/auth",       authRouter);
router.use("/products",   productsRouter);
router.use("/kits",       kitsRouter);
router.use("/orders",     ordersRouter);
router.use("/payments",   paymentsRouter);
router.use("/reviews",    reviewsRouter);
router.use("/coupons",    couponsRouter);
router.use("/banners",    bannersRouter);
router.use("/settings",   settingsRouter);
router.use("/upload",     uploadRouter);
router.use("/newsletter", newsletterRouter);
