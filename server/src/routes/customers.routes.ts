import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getCustomer,
  listCustomers,
  setCustomerActive,
} from "../controllers/customers.controller";

export const customersRouter = Router();

customersRouter.use(authenticate, requireAdmin);
customersRouter.get("/", listCustomers);
customersRouter.get("/:id", getCustomer);
customersRouter.patch("/:id/active", setCustomerActive);
