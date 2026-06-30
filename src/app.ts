import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { initDB, pool } from "./db/index.js";
import { userRoute } from "./modules/user/user.route.js";
import { profileRoute } from "./modules/profile/profile.route.js";
import { authRoute } from "./modules/auth/auth.route.js";
import fs from 'fs'
import logger from "./middlewares/logger.js";
const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true })); // Extend will take nested data also

app.use(logger)

initDB();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express server running ....",
    author: "Md Rijoan Maruf",
  });
});

app.use("/api/users" , userRoute);
app.use("/api/profile" , profileRoute);
app.use("/api/auth" , authRoute);

export default app;