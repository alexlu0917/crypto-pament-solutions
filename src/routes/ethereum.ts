
import { Router } from "express";
import * as ethereumController from "../controllers/ethereumController"

const ethereumRouter = Router(); 

ethereumRouter.post("/createAccount", ethereumController.createAccount);

ethereumRouter.post("/sendEtherToOwner", ethereumController.transferEtherToOwner);

export default ethereumRouter;