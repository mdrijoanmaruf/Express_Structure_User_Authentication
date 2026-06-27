import type { Request, Response } from "express";
import { pool } from "../../db/index.js";
import { userService } from "./user.service.js";

const createUser = async (req: Request, res: Response) => {
  try {
    // console.log(req.body)
    // const { name, email, password, is_active, age, created_at, updated_at } =
    //   req.body;

    const result = await userService.createUserIntoDB(req.body)

    // console.log(result.rows[0])
    res.status(201).json({
      message: "User created successfully",
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
}

export const userController = {
    createUser,
}