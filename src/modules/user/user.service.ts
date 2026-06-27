import { pool } from "../../db/index.js";
import type { IUser } from "./user.interface.js";

const createUserIntoDB = async(payload : IUser) => {
    const {name, email, password, is_active, age} = payload;
    const result = await pool.query(
      `
        INSERT INTO users(name , email , password , is_active , age , created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `,
      [name, email, password, is_active, age],
    );
    return result;
}

export const userService = {
    createUserIntoDB,
}