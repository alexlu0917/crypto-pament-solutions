import { Router } from "express";
import * as controller from "../controllers/index";
import ethereumRouter from "./ethereum";

export const index = Router();

index.get("/", controller.index);
index.use("/ethereum", ethereumRouter);


