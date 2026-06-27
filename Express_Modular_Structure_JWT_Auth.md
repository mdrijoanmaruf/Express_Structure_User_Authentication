# Express Modular Structure + JWT Auth — Revision Notes

> **Goal:** Build an Express + TypeScript + PostgreSQL + JWT authentication app with modular folder structure.  
> Use this note to revise the full setup process from scratch.

---

## STEP 1 — Initialize Project

> Creates a new Node.js project and generates `package.json`.

```bash
npm init -y
```

Then add `"type": "module"` inside `package.json` — this enables **ESM (ES Modules)** syntax (`import/export`) instead of CommonJS (`require`).

---

## STEP 2 — Install Packages

> Install all required runtime and development packages.

**Dependencies** — used in production:
```bash
# express: web framework | pg: PostgreSQL client
# dotenv: load .env vars | bcryptjs: hash passwords | jsonwebtoken: create JWT tokens
npm install express pg dotenv bcryptjs jsonwebtoken
```

**Dev Dependencies** — only used during development:
```bash
# typescript: TS compiler | tsx: run TS files directly without compiling
# @types/*: type definitions for the installed packages
npm install -D typescript tsx @types/express @types/pg @types/jsonwebtoken
```

> `tsx watch` watches for file changes and restarts automatically — replaces `nodemon` for TypeScript.

---

## STEP 3 — tsconfig.json

> Configure how TypeScript compiles your code.

```bash
npx tsc --init   # generates a default tsconfig.json
```

Key settings to set manually:
```json
{
  "compilerOptions": {
    "rootDir": "./src",       // TypeScript source files live here
    "outDir": "./dist",       // Compiled JS output goes here
    "module": "nodenext",     // Use Node.js native ESM module resolution
    "target": "esnext",       // Compile to modern JavaScript
    "strict": true            // Enable all strict type checks
  }
}
```

> ⚠️ **Important:** With `"module": "nodenext"` — always use `.js` extension in imports, even in `.ts` files:
> ```ts
> import { pool } from "../../db/index.js"  // ✅ correct — .js required
> import { pool } from "../../db/index"     // ❌ wrong — will fail at runtime
> ```

---

## STEP 4 — Dev Script in package.json

> Add a script to run the dev server easily.

```json
"scripts": {
  "dev": "tsx watch ./src/server.ts"   // watches src/server.ts and restarts on change
}
```

Run with:
```bash
npm run dev
```

---

## STEP 5 — Folder Structure

> Every feature lives in its own module folder. Each module has 4 files: interface, service, controller, route.

```
src/
├── server.ts           ← entry point: starts server + DB
├── app.ts              ← express app setup + mount all routes
├── config/
│   └── index.ts        ← reads .env and exports config object
├── db/
│   └── index.ts        ← creates pg pool + initializes DB tables
└── modules/
    ├── user/
    │   ├── user.interface.ts    ← TypeScript type for User
    │   ├── user.service.ts      ← DB query functions (CRUD)
    │   ├── user.controller.ts   ← handles req/res, calls service
    │   └── user.route.ts        ← maps routes to controllers
    ├── auth/
    │   ├── auth.service.ts      ← login logic + JWT generation
    │   ├── auth.controller.ts   ← handles login req/res
    │   └── auth.route.ts        ← POST /login route
    └── profile/
        ├── profile.service.ts   ← create profile DB logic
        ├── profile.controller.ts
        └── profile.route.ts
```

---

## STEP 6 — .env File

> Store sensitive config values outside your code. Never commit this file.

```env
# PostgreSQL connection string from your hosting provider (e.g. Neon, Supabase, local)
CONNECTION_STRING=postgresql://user:pass@host:port/dbname

PORT=3000

# Secret key used to sign JWT tokens — keep this private and strong
JWT_SECRETE=your_super_secret_key_here
```

> Add `.env` to `.gitignore` so it's never pushed to GitHub.

---

## STEP 7 — config/index.ts

> Centralizes all env variable reading in one place. Import `config` everywhere instead of `process.env` directly.

```ts
import dotenv from "dotenv"
import path from "path"

// Load .env file from the project root
dotenv.config({ path: path.join(process.cwd(), ".env") })

const config = {
  connection_string: process.env.CONNECTION_STRING as string, // cast to string (env vars are string | undefined)
  port: process.env.PORT,                                     // server port
  secrete: process.env.JWT_SECRETE,                           // JWT secret key
}

export default config
```

---

## STEP 8 — db/index.ts

> Creates the PostgreSQL connection pool and auto-creates tables when the server starts.

```ts
import { Pool } from "pg"
import config from "../config/index.js"

// Pool manages multiple DB connections efficiently
export const pool = new Pool({ connectionString: config.connection_string })

export const initDB = async () => {
  try {
    // Create users table if it doesn't already exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id         SERIAL PRIMARY KEY,        -- auto-increment ID
        name       VARCHAR(20),
        email      VARCHAR(20) UNIQUE NOT NULL,
        password   VARCHAR(20) NOT NULL,
        is_active  BOOLEAN DEFAULT true,      -- soft-disable user without deleting
        age        INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create profiles table — linked to users via foreign key
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles(
        id         SERIAL PRIMARY KEY,
        user_id    INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,  -- FK: 1 profile per user
        bio        TEXT,
        address    TEXT,
        phone      VARCHAR(15),
        gender     VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log("Database connected successfully")
  } catch (error) {
    console.log(error)
  }
}
```

> `REFERENCES users(id) ON DELETE CASCADE` — if a user is deleted, their profile row is also automatically deleted.

---

## STEP 9 — server.ts

> The actual entry point. Calls `initDB()` to set up tables, then starts the HTTP server.

```ts
import app from "./app.js"
import config from "./config/index.js"
import { initDB } from "./db/index.js"

const main = () => {
  initDB()                           // create tables if they don't exist
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

main()  // kick everything off
```

---

## STEP 10 — app.ts

> Sets up Express, applies middleware, and mounts all module routes.

```ts
import express from "express"
import { userRoute } from "./modules/user/user.route.js"
import { authRoute } from "./modules/auth/auth.route.js"
import { profileRoute } from "./modules/profile/profile.route.js"

const app = express()

// Middleware — parse incoming request bodies
app.use(express.json())                          // parse JSON body
app.use(express.urlencoded({ extended: true })) // parse form/url-encoded body

// Mount module routers at their base paths
app.use("/api/users", userRoute)
app.use("/api/auth", authRoute)
app.use("/api/profile", profileRoute)

export default app
```

---

## STEP 11 — Modular Pattern (Route → Controller → Service)

> Every module follows this exact 3-layer flow. The same pattern repeats for every feature.

```
HTTP Request
     │
     ▼
route.ts        ← maps URL + method to a controller function
     │
     ▼
controller.ts   ← receives req/res, calls service, sends response
     │
     ▼
service.ts      ← runs the actual SQL query via pool, returns result
     │
     ▼
PostgreSQL      ← database
     │
     ▼
JSON Response
```

- **route.ts** — only defines routes and maps them to controllers
- **controller.ts** — handles request, calls service, returns JSON (no SQL here)
- **service.ts** — all SQL/business logic lives here (no req/res here)

---

## STEP 12 — User Module

### user.interface.ts
> TypeScript interface for the User shape. Used for type safety in service and controller.

```ts
export interface IUser {
  name: string
  email: string
  password: string
  is_active?: boolean   // optional — defaults to true in DB
  age: number
}
```

### user.service.ts — SQL Queries

```ts
// CREATE — insert new user, return the created row
INSERT INTO users(name, email, password, is_active, age)
VALUES($1, $2, $3, $4, $5) RETURNING *

// READ ALL — fetch every user
SELECT * FROM users

// READ ONE — fetch user by ID
SELECT * FROM users WHERE id=$1

// UPDATE — partial update using COALESCE
// COALESCE($1, name) means: use $1 if provided, else keep existing 'name'
UPDATE users SET
  name      = COALESCE($1, name),
  password  = COALESCE($2, password),
  age       = COALESCE($3, age),
  is_active = COALESCE($4, is_active)
WHERE id=$5 RETURNING *

// DELETE — remove user, return the deleted row
DELETE FROM users WHERE id=$1 RETURNING *
```

> `RETURNING *` → sends back the affected row so the controller can return it in the response.

### user.route.ts
```ts
router.post("/", userController.createUser)           // POST   /api/users
router.get("/", userController.getAllUsers)            // GET    /api/users
router.get("/:id", userController.getSingleUser)      // GET    /api/users/:id
router.put("/:id", userController.updateSingleUser)   // PUT    /api/users/:id
router.delete("/:id", userController.deleteUser)      // DELETE /api/users/:id
```

---

## STEP 13 — Auth Module (Login + JWT)

> No registration here — users are created via the user module. Auth only handles **login**.

### auth.service.ts — Login flow:

```ts
// Step 1: Find user in DB by email
SELECT * FROM users WHERE email=$1
// If no user found → throw error (don't reveal whether email or password was wrong)

// Step 2: Compare the plain input password against the hashed password in DB
const match = await bcrypt.compare(inputPassword, user.password)
if (!match) throw new Error("Invalid Credentials")  // passwords don't match

// Step 3: Create a signed JWT token with user info as payload
const token = jwt.sign(
  { id, name, email, is_active },  // payload — data stored in the token
  config.secrete as string,        // secret key — cast to string (env vars are string | undefined)
  { expiresIn: '1d' }              // token expires in 1 day
)

return token  // send token back to the client
```

### auth.route.ts
```ts
router.post("/login", authController.loginUser)  // POST /api/auth/login
```

---

## STEP 14 — Profile Module

> Profile is linked to a user via `user_id` foreign key. One user = one profile.

### profile.service.ts — Create profile:

```ts
// Step 1: Verify the user actually exists before creating a profile for them
SELECT * FROM users WHERE id=$1
if (rows.length === 0) throw new Error("User Not Exists!")  // guard check

// Step 2: Insert the profile linked to that user
INSERT INTO profiles(user_id, bio, address, phone, gender)
VALUES ($1, $2, $3, $4, $5)
// user_id is UNIQUE so each user can only have ONE profile
```

### profile.route.ts
```ts
router.post("/", profileController.createProfile)   // POST /api/profile
```

---

## STEP 15 — Controller Pattern (same for all modules)

> Every controller follows this exact try/catch structure. Memorize this once.

```ts
const doSomething = async (req: Request, res: Response) => {
  try {
    // Extract params or body from the request
    const { id } = req.params

    // Call the service function — it talks to the DB
    const result = await someService.doSomethingInDB(id as string, req.body)

    // If result is empty, the item wasn't found
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Not Found" })
    }

    // Return successful response with DB result
    return res.status(200).json({ success: true, data: result.rows[0] })

  } catch (error: any) {
    // Catch any unexpected errors (DB down, bad query, etc.)
    return res.status(500).json({ success: false, message: error.message })
  }
}
```

---

## Key Reminders

| ⚠️ Gotcha | 💡 Detail |
|---|---|
| Always use `.js` in imports | Required by `module: nodenext` even in `.ts` files |
| `REFERENCES` not `REFERENCE` | SQL keyword — the plural matters |
| `SELECT * FROM table` | Never use `SELECT ALL table` — invalid SQL |
| `COALESCE($1, column)` | Use for partial update — keeps old value when new one is `null` |
| `config.secrete as string` | Env vars are `string \| undefined` — cast needed for jwt.sign |
| `RETURNING *` in SQL | Returns the row after INSERT/UPDATE/DELETE — needed for response |
| `ON DELETE CASCADE` | Auto-deletes child rows (profiles) when parent (user) is deleted |
| `IF NOT EXISTS` in CREATE TABLE | Safe to run on every startup — won't fail if table already exists |
