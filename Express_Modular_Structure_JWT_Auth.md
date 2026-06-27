# 📦 Express Modular Structure — JWT Auth Notes

> A complete reference guide for the **Express + TypeScript + PostgreSQL + JWT** authentication project.  
> Author: **Md Rijoan Maruf**

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [TypeScript Configuration](#-typescript-configuration)
- [Database Schema](#-database-schema)
- [Module Flow](#-module-flow)
  - [User Module](#-user-module)
  - [Auth Module](#-auth-module)
  - [Profile Module](#-profile-module)
- [API Endpoints](#-api-endpoints)
- [Request & Response Format](#-request--response-format)
- [JWT Flow](#-jwt-flow)
- [Common Errors & Fixes](#-common-errors--fixes)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js v5 |
| Database | PostgreSQL (via `pg`) |
| Password Hashing | `bcryptjs` |
| Auth Token | `jsonwebtoken` (JWT) |
| Dev Runner | `tsx watch` |
| Config | `dotenv` |

---

## 🗂 Project Structure

```
Express_Structure_User_Authentication/
├── src/
│   ├── server.ts               # Entry point — starts server & DB
│   ├── app.ts                  # Express app setup & route mounting
│   ├── config/
│   │   └── index.ts            # Environment variable config
│   ├── db/
│   │   └── index.ts            # PostgreSQL pool & table initialization
│   └── modules/
│       ├── user/
│       │   ├── user.interface.ts
│       │   ├── user.service.ts
│       │   ├── user.controller.ts
│       │   └── user.route.ts
│       ├── auth/
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   └── auth.route.ts
│       └── profile/
│           ├── profile.service.ts
│           ├── profile.controller.ts
│           └── profile.route.ts
├── .env
├── package.json
└── tsconfig.json
```

---

## 🚀 Installation & Setup

### 1. Clone or Initialize Project

```bash
mkdir my-project && cd my-project
npm init -y
```

### 2. Install Production Dependencies

```bash
npm install express pg dotenv bcryptjs jsonwebtoken
```

### 3. Install Development Dependencies

```bash
npm install -D typescript tsx @types/express @types/pg @types/bcryptjs @types/jsonwebtoken
```

### 4. Generate tsconfig.json

```bash
npx tsc --init
```

### 5. Add Scripts to `package.json`

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch ./src/server.ts",
    "build": "tsc"
  }
}
```

### 6. Run Dev Server

```bash
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the root of the project:

```env
CONNECTION_STRING=postgresql://username:password@host:port/dbname
PORT=3000
JWT_SECRETE=your_super_secret_key_here
```

> ⚠️ **Never commit `.env` to Git.** Add it to `.gitignore`.

---

## ⚙️ TypeScript Configuration

Key settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "esnext",
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

> **Note:** With `"module": "nodenext"`, all local imports must use `.js` extension even in `.ts` files:
> ```ts
> import { pool } from "../../db/index.js"; // ✅ correct
> import { pool } from "../../db/index";    // ❌ wrong
> ```

---

## 🗄️ Database Schema

### `users` Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(20),
  email      VARCHAR(20) UNIQUE NOT NULL,
  password   VARCHAR(20) NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  age        INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `profiles` Table

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id         SERIAL PRIMARY KEY,
  user_id    INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio        TEXT,
  address    TEXT,
  phone      VARCHAR(15),
  gender     VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

> **Key:** `user_id` is a **foreign key** to `users(id)` with `ON DELETE CASCADE` — if a user is deleted, their profile is also deleted automatically.

---

## 🔄 Module Flow

### Request Lifecycle

```
HTTP Request
    │
    ▼
app.ts (Route Mounting)
    │
    ▼
module.route.ts (Router)
    │
    ▼
module.controller.ts (Handle req/res)
    │
    ▼
module.service.ts (Business Logic + DB Query)
    │
    ▼
PostgreSQL (via pg Pool)
    │
    ▼
Response (JSON)
```

---

### 👤 User Module

**Interface** — `user.interface.ts`
```ts
export interface IUser {
  name: string;
  email: string;
  password: string;
  is_active?: boolean;
  age: number;
}
```

**Service** — `user.service.ts`

| Function | Description |
|---|---|
| `createUserIntoDB(payload)` | Insert new user |
| `getAllUserFromDB()` | Select all users |
| `getSingleUserFromDB(id)` | Select user by ID |
| `updateSingleUserInDB(id, payload)` | Update user fields with COALESCE |
| `deleteUserFromDB(id)` | Delete user by ID, returns deleted row |

**Controller** — `user.controller.ts`

| Handler | Description |
|---|---|
| `createUser` | POST — creates a user |
| `getAllUsers` | GET — returns all users |
| `getSingleUser` | GET — returns user by id |
| `updateSingleUser` | PUT — updates user by id |
| `deleteUser` | DELETE — removes user by id |

---

### 🔑 Auth Module

**Login Flow:**

```
POST /api/auth/login
        │
        ▼
auth.controller.ts → loginUser()
        │
        ▼
auth.service.ts → loginUserIntoDB()
        │
  1. SELECT * FROM users WHERE email=$1
        │
  2. bcrypt.compare(inputPassword, hashedPassword)
        │
  3. jwt.sign({ id, name, email, is_active }, JWT_SECRET, { expiresIn: '1d' })
        │
        ▼
  Returns: { accessToken }
```

---

### 🪪 Profile Module

**Create Profile Flow:**

```
POST /api/profile
        │
        ▼
profile.controller.ts → createProfile()
        │
        ▼
profile.service.ts → createProfileIntoDB()
        │
  1. SELECT * FROM users WHERE id=$1  (validate user exists)
        │
  2. INSERT INTO profiles(user_id, bio, address, phone, gender)
        │
        ▼
  Returns: created profile row
```

---

## 🌐 API Endpoints

### Users — `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/users/:id` | Get single user |
| `PUT` | `/api/users/:id` | Update a user |
| `DELETE` | `/api/users/:id` | Delete a user |

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and get JWT token |

### Profile — `/api/profile`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/profile` | Create user profile |

---

## 📨 Request & Response Format

### Create User — `POST /api/users`

**Request Body:**
```json
{
  "name": "Rijoan Maruf",
  "email": "rijoan@example.com",
  "password": "secret123",
  "age": 25,
  "is_active": true
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "data": { ...userRow }
}
```

---

### Login — `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "rijoan@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User Login successfully",
  "data": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

---

### Create Profile — `POST /api/profile`

**Request Body:**
```json
{
  "user_id": 1,
  "bio": "Full Stack Developer",
  "address": "Dhaka, Bangladesh",
  "phone": "01712345678",
  "gender": "Male"
}
```

---

### Update User — `PUT /api/users/:id`

All fields are optional (uses `COALESCE` in SQL):

```json
{
  "name": "New Name",
  "age": 26
}
```

---

## 🔐 JWT Flow

```
1. User sends email + password  →  POST /api/auth/login
2. Server fetches user from DB by email
3. bcrypt.compare(inputPass, storedHash)  →  verify password
4. jwt.sign(payload, SECRET, { expiresIn: '1d' })  →  generate token
5. Token returned to client
6. Client stores token (localStorage / cookie)
7. Client sends token in future requests:
      Authorization: Bearer <token>
8. Server middleware verifies token on protected routes
```

> **Token Payload:**
> ```json
> {
>   "id": 1,
>   "name": "Rijoan Maruf",
>   "email": "rijoan@example.com",
>   "is_active": true
> }
> ```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `column "user_id" of relation "profiles" does not exist` | Table was created before the column was defined correctly | DROP and recreate the table |
| `Type 'undefined' is not assignable to type 'string'` | `config.secrete` can be `undefined` | Use `config.secrete as string` or assert with `!` |
| `SELECT ALL users WHERE email=$1` | Invalid SQL syntax | Change to `SELECT * FROM users WHERE email=$1` |
| `REFERENCE users(id)` | Wrong SQL keyword | Change to `REFERENCES users(id)` |
| Import without `.js` extension fails | TypeScript `nodenext` module resolution | Always use `.js` extension in imports |

---

## 📝 Quick COALESCE Pattern (Partial Update)

When updating, use `COALESCE` so that only the fields provided in the request body are updated:

```sql
UPDATE users SET
  name      = COALESCE($1, name),
  password  = COALESCE($2, password),
  age       = COALESCE($3, age),
  is_active = COALESCE($4, is_active)
WHERE id = $5
RETURNING *;
```

This means: *"Use the new value if provided, otherwise keep the existing value."*

---

*Last updated: June 2026*