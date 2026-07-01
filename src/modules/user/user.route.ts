import { Router } from "express";
import { userController } from "./user.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();



router.post("/", userController.createUser);
router.get("/", auth , userController.getAllUsers);
router.get("/:id", userController.getSingleUser);
router.put("/:id", userController.updateSingleUser);
router.delete("/:id", userController.deleteUser);


export const userRoute = router;
