import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  updateCustomerProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listPets,
  createPet,
  updatePet,
  deletePet,
  listCustomerOrders,
} from "../controllers/customer.controller";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.patch("/me", updateCustomerProfile);

customerRouter.get("/addresses", listAddresses);
customerRouter.post("/addresses", createAddress);
customerRouter.put("/addresses/:id", updateAddress);
customerRouter.delete("/addresses/:id", deleteAddress);

customerRouter.get("/pets", listPets);
customerRouter.post("/pets", createPet);
customerRouter.put("/pets/:id", updatePet);
customerRouter.delete("/pets/:id", deletePet);

customerRouter.get("/orders", listCustomerOrders);
