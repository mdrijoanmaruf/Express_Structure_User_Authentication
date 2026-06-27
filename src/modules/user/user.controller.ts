import type { Request, Response } from "express";
import { pool } from "../../db/index.js";

const createUser = async (req: Request, res: Response) => {
  try {
    // console.log(req.body)
    const { name, email, password, is_active, age, created_at, updated_at } =
      req.body;

    const result = await pool.query(
      `
        INSERT INTO users(name , email , password , is_active , age , created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `,
      [name, email, password, is_active, age, created_at, updated_at],
    );

    // console.log(result.rows[0])
    res.status(201).json({
      message: "User created successfully",
      data: {
        name,
        email,
        created_at,
        updated_at,
      },
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