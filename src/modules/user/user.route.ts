import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();
// STEP 2 : Make routes and call controller
router.post("/", userController.createUser);
// Get All users Method
router.get("/", userController.getAllUsers);


export const userRoute = router;
