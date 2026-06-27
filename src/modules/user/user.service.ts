import { pool } from "../../db/index.js";

const createUserIntoDB = async(payload : any) => {
    const {name, email, password, is_active, age, created_at, updated_at} = payload;
    const result = await pool.query(
      `
        INSERT INTO users(name , email , password , is_active , age , created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `,
      [name, email, password, is_active, age, created_at, updated_at],
    );
    return result;
}

export const userService = {
    createUserIntoDB,
}