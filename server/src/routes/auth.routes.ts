import { Router } from "express";
import { login, refresh, me, changePassword } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login",           login);
authRouter.post("/refresh",         refresh);
authRouter.get("/me",               authenticate, me);
authRouter.put("/change-password",  authenticate, changePassword);
