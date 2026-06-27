import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { initDB, pool } from "./db/index.js";
import { userRoute } from "./modules/user/user.route.js";
const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true })); // Extend will take nested data also



initDB();

app.get("/", (req: Request, res: Response) => {
  //   res.send('Express Server is running')
  res.status(200).json({
    message: "Express server running ....",
    author: "Md Rijoan Maruf",
  });
});

// STEP 1 : Use the router
app.use("/api/users" , userRoute);




// Get a user Method
app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
            SELECT * FROM users WHERE id=$1
            `,
      [id],
    );

    if (result.rows.length == 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found",
      });

      res.status(200).json({
        success: true,
        message: "Single User retrieved successfully",
        data: result.rows,
      });
    }
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

// Update a user method
app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, password, age, is_active } = req.body;
    const result = pool.query(
      `
            UPDATE users SET 
            name=COALESCE($1 ,name) , 
            password=COALESCE($2,password), 
            age=COALESCE($3 ,age), 
            is_active=COALESCE($4, is_active) 
            WHERE id=${id} RETURNING *
            `,
      [name, password, age, is_active],
    );

    if((await result).rows.length == 0){
        res.status(404).json({
      success: false,
      message: "User not found"
    });
    }
    res.status(200).json({
        success: true,
        message: "User Updated successfully",
        data: (await result).rows[0]
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

// Delete single user
app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = pool.query(
      `
            DELETE FROM users where id=${id}
            `,
    );
    
    res.status(200).json({
        success: true,
        message: "User Deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

export default app;
