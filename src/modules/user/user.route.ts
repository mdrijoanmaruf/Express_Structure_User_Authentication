import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();
// Post a user Method
router.post("/", userController.createUser);

export const userRoute = router;
