import { Router } from "express";
import * as controller from "../controllers/index";
import * as ethereumController from "../controllers/ethereumController"

export const index = Router();

index.get("/", controller.index);

index.post("/ethereum/createAccount", ethereumController.createAccount);
