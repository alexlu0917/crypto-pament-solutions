import { Router } from "express";
import * as controller from "../controllers/index";
import ethereumRouter from "./ethereum";
import bitcoinRouter from "./bitcoin";

export const index = Router();

index.get("/", controller.index);
index.use("/ethereum", ethereumRouter);
index.use("/bitcoin", bitcoinRouter);


