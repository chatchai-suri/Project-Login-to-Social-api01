# Server

## Step 1 create package
```bash
npm init -y
```
### Step 2 install package (dependencies), make essential folder and file & update package.json
#### step 2.1 install package
```bash
npm install express cors helmet cookie-parser dotenv argon2 jsonwebtoken node-cron passport passport-facebook passport-github2 passport-google-oauth20 zod uuid
```
### step 2.2 make essencial folder files
 src, src/add.js, src/server.js
### step 2.3 package.json add statement to run code at "scripts" follow path from 2.2
```json
 "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon src/server.js" <-- add this line, don't forget to install nodemon at step 3 (or add nodemon after step 3)
  },
```
### step 2.4 make common folders under src
 src/config
 src/controllers
 src/middlewares
 src/routes
 src/services
 src/utils
### Step 3 install package (devDependencies)
```bash
npm install -D prisma nodemon
```
### Step 4 npx prisma init to obtain file .gitignore, .env and folder prisma 
```bash
npx prisma init
```
### Step 5 push to github
create repo at github.com
```bash
git init
git add README.md
git commit -m "Project setup"
git branch -M main
git remote add origin https://github.com/chatchai-suri/Project-Login-to-Social-api01.git
git push -u origin main
```
### Step 6 set up database
#### step 6.1 customize schema.prisma to provider = "mysql"
``` schema
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
#### step 6.2 create schema.prisma model
``` schema
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id       String  @id @default(cuid())
  email    String  @unique
  name     String?
  password String?
  coverImg String? @map("cover_img")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(0)

  refreshTokens RefreshToken[]
  accounts      Account[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  hashToken String   @unique @map("hash_token")
  revoked   Boolean  @default(false)
  expiresAt DateTime @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(0)
  // relations
  user      User?    @relation(fields: [userId], references: [id])
  userId    String?  @map("user_id")
}

model Account {
  id                String @id @default(cuid())
  type              String // 'oauth'
  // 'github', 'google', etc.
  provider          String // 'github', 'google', etc.
  // the id of the account on the provider's side
  providerAccountId String @map("provider_account_id")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(0)
  // relations
  user      User?    @relation(fields: [userId], references: [id])
  userId    String?  @map("user_id")

  @@unique([provider, providerAccountId])
}
```
#### step 6.3 customize .env to use mysql local
```env
DATABASE_URL="mysql://root:pooSQL123@localhost:3306/db_login_with_social"
```
#### step 6.4 immigate to database
```bash
npx prisma db push
```
schema model DB and folder src/generated was created
#### step 6.5 customize file src/config/prisma.config.js
to export prisma instance with looging enable
```js
// src/config/prisma.config.js
import { PrismaClient } from "..generated/prisma/client.js";

// Create a new instance of the Prisma Client with logging enabled
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Ensure that the Prisma Client instance is properly disconnected when the Node.js process ends
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
```
### Step 7 Middleware setup and start Server
#### step 7.1 .env customize path for core() and PORT no.
```env
PORT=8887 // backend port

DATABASE_URL="mysql://root:pooSQL123@localhost:3306/db_login_with_social_01"

CLIENT_URL="http://localhost:5173"
```
#### step 7.2 src/middlewares/error.middleware.js prepare file.js for all other error handling
```js
import { ZodError } from "zod";

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if(error instanceof ZodError) {
    const validateErrors = error.errors.reduce((acc, cur) => (
      {
        ...acc,
        [cur.path[0]]: cur.message
      }
    ), {});

    error.errors = validateErrors;
  }

  res.status(...error, err.statusCode || 500).json({ message: err.message || 'Somthing went wrong' });
}

export default errorMiddleware;
```
#### step 7.3 src/app.js import middleware and use
```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})); // Enable CORS for the client URL

app.use(express.json()); // Prase JSON body, req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies, req.cookies

// API routes

// not found route

// Error handling middleware

export default app;
```
#### step 7.4 src/app.js import src/middlewares/error.middleware.js and use at end of file app.js
```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js'; <-- make sure there .js (dot js)

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})); // Enable CORS for the client URL

app.use(express.json()); // Prase JSON body, req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies, req.cookies

// API routes

// not found route

// Error handling middleware
app.use(errorMiddleware); <-- call errorMiddleware

export default app;
```
#### step 7.5 src/app.js add code for handle path not found
```js
// not found route
// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `path not found ${req.method} ${req.url}` }); 
});
```
#### step 7.6 src/server.js add for running server
```js
import app from './app.js';

const PORT = process.env.PORT || 8887;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
```
#### step 7.6 at Terminal, run server
```bash
npm run dev
```
#### step 7.8 package.json correct warning [MODULE_TYPELESS_PACKAGE_JSON]
```json
  "name": "server01",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module", <-- add this line, don't forget comma ","
```
```js
then get message 
[nodemon] restarting due to changes...
[nodemon] starting `node src/server.js`
Server is running on port 8887
```
### Step 8 make Routing
#### step 8.1 /src/routes/auth.routes.js
make auth route (only route, no middleware and logic)
```js
import { Router } from "express";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {})
authRouter.post("/login", async (req, res) => {})
authRouter.post("/refresh-token", async (req, res) => {})
authRouter.post("/logout", async (req, res) => {})

// Google OAuth
authRouter.get("/google", async (req, res) => {})
authRouter.get("/google/callback", async (req, res) => {})

// GitHub OAuth
authRouter.get("/github", async (req, res) => {})
authRouter.get("/github/callback", async (req, res) => {})

// Facebook OAuth
authRouter.get("/facebook", async (req, res) => {})
authRouter.get("/facebook/callback", async (req, res) => {})

export default authRouter;
```
#### step 8.2 /src/routes/user.routers.js
make user route (only route, no middleware and logic)
```js
import { Router } from "express";

const userRouter = Router();

userRouter.get("/me", async (req, res) => {})

export default userRouter;
```
#### step 8.3 /src/routes/main.routes.js
combine all routes (authRoutes, userRoutes) into mainRoutes
```js
import { Router } from "express";
import authRouter from "./auth.routes.js"; // make sure the .js (dot js) is exist at file name
import userRouter from "./user.routes.js"; // make sure the .js (dot js) is exist at file name

const mainRouter = Router();

mainRouter.use("/auth", authRouter)
mainRouter.use("/user", userRouter)

export default mainRouter;
```
#### step 8.4 /src/app.js
call and use main.routes.js in app.js
```js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.middleware.js";
import mainRouter from "./routes/main.routes.js"; // <-- make sure that there .js

const app = express();

app.use(helmet()); // Use Helmet to help secure Express apps with various HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
); // Enable CORS for all routes and allow credentials (cookies, authorization headers, etc.)

app.use(express.json()); // Parse incoming JSON requests and put the parsed data in req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names, req.cookies

// API routes
app.use("/api/v1", mainRouter); // <-- add this line to use mainRouter

app.use((req, res) => {
  res.status(404).json({ message: `path not found ${req.method} ${req.url}` }); // Handle 404 errors for undefined routes
});
app.use(errorMiddleware); // Error handling middleware

export default app;
```
### Step 9 Controller register & utils createError
#### step 9.1 src/utils/createError.js
```js
export default function createError(statusCode, msg, errors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.errors = errors || null;
  err.success = false;

  return err;
}
```
#### step 9.2 src/controllers/auth/register.js
```js
import argon2 from "argon2";
import { prisma } from "../../config/prisma.config.js";
import createError from "../../utils/createError.js";

export default async function registerController(req, res) {
  // step 1: get user data from req.body
  const { email, name, password, coverImg } = req.body;

  // step 2: validate user data (e.g., check if email and password are provided)
  // validation will be done via zod schema in the route middleware

  // step 3: check if the user already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw createError(400, "User already exists with this email");
  }
  // If validation fails, throw an error using createError utility

  // step 4: hash the password for security by argon2
  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id, // argon2d, argon2i, argon2id
    length: 64, // length of the hash
  });

  // step 5: save the new user to the database
  const data = { email, password: hashedPassword };
  if (name) data.name = name;
  if (coverImg) data.coverImg = coverImg;
  const newUser = await prisma.user.create({ data });

  // step 6: respond with success message or user data to the client
  res.status(201).json({
    data: null,
    message: "User registered successfully",
    success: true,
  });
}
```
#### step 9.3 src/routers/auth.routes.js update
```js
import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController) // <-- update
authRouter.post("/login", async (req, res) => {}) // generate access token and refresh token
authRouter.post("/refresh-token", async (req, res) => {}) // generate new access token using refresh token
authRouter.post("/logout", async (req, res) => {})

// Google OAuth
authRouter.get("/google", async (req, res) => {}) // redirect to google oauth consent screen
authRouter.get("/google/callback", async (req, res) => {}) // handle google oauth callback

// GitHub OAuth
authRouter.get("/github", async (req, res) => {}) // redirect to github oauth consent screen
authRouter.get("/github/callback", async (req, res) => {}) // handle github oauth callback

// Facebook OAuth
authRouter.get("/facebook", async (req, res) => {}) // redirect to facebook oauth consent screen
authRouter.get("/facebook/callback", async (req, res) => {}) // handle facebook oauth callback

export default authRouter;
```
### Step 10 Controller login, generate token & refresh token
#### step 10.1 .env prepare for login.controller.js
```js
NODE_ENV = "development" <-- add

PORT=8887 // backend port

DATABASE_URL="mysql://root:pooSQL123@localhost:3306/db_login_with_social_01"

CLIENT_URL="http://localhost:5173"

ACCESS_TOKEN_SECRET="myaccesstokensecret12345" <-- add
ACCESS_TOKEN_EXPIRY="15m" <--add

REFRESH_TOKEN_SECRET="myrefreshtokensecret12345" <--add
REFRESH_TOKEN_EXPIRY="7d" <--add
```
#### Step 10.2 src/controllers/login.controller.js
```js
import prisma from "../../config/prisma.config.js";
import createError from "../../utils/createError.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";

// Login Controller
export default async function (req, res){
// step 1: get user data from req.body
  const { email, password } = req.body;
  
// step 2: validate user data (e.g., check if email and password are provided)
// validation will be done via zod schema in the route middleware

// step 3: check if email & passwaord are correct
  const user = await prisma.user.findUnique({where: { email }, omit: { password: true, createdAt: true, updatedAt: true }
  });

  if(!user){
    // if user not found, throw error
    throw createError(400, "Invalid email or password");
  }

  const isMatchPassword = await argon2.verify(user.password, password);
  if(!isMatchPassword){
    // if password does not match, throw error
    throw createError(400, "Invalid email or password");
  }

// step 4: generate access token and refresh token
  const payload = { sub: user.id };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

  const refreshTokenId = uuidv4(); // generate unique id for refresh token 
  const refreshToken = jwt.sign({ jti:refreshTokenId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

// step 5: hash the refresh token id and store it in the database
  const hashedTokenId = await argon2.hash(refreshTokenId);
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000); // 7 days and convert to milliseconds 

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      hashToken: hashedTokenId,
      expiresAt: expiresAt
    }})

// step 5: send tokens to client in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
      sameSite: "strict", // protect CSRF
      maxAge: 7*24*60*60*1000 // 7 days and convert to milliseconds 
    });


// step 6: respond with success message or user data to the client
    res.status(200).json({
      data: { accessToken, user },
      message: "Login successful",
      success: true,})
}
```
#### step 10.3 src/routers/auth.routes.js update
```js
import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.post("/login", loginController) // generate access token and refresh token
authRouter.post("/refresh-token", async (req, res) => {}) // generate new access token using refresh token
authRouter.post("/logout", async (req, res) => {})

// Google OAuth
authRouter.get("/google", async (req, res) => {}) // redirect to google oauth consent screen
authRouter.get("/google/callback", async (req, res) => {}) // handle google oauth callback

// GitHub OAuth
authRouter.get("/github", async (req, res) => {}) // redirect to github oauth consent screen
authRouter.get("/github/callback", async (req, res) => {}) // handle github oauth callback

// Facebook OAuth
authRouter.get("/facebook", async (req, res) => {}) // redirect to facebook oauth consent screen
authRouter.get("/facebook/callback", async (req, res) => {}) // handle facebook oauth callback

export default authRouter;
```
### Step 11 Controller refreshToken
#### step 11.1 src/controllers/refresh.controller.js
```js
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import prisma from "../../config/prisma.config.js";
import createError from "../../utils/createError.js";

export default async function (req, res) {
  // step 1: get refresh token from httpOnly cookie
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    throw createError(401, "Refresh token is required");
  }

  // step 2: verify refresh token
  let payloadRefreshToken;
  try {
    payloadRefreshToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw createError(401, "Invalid or expired refresh token");
  }

  const { jti: refreshTokenId } = payloadRefreshToken; // get the jti (unique id) from the payload

  // step 3: find the refresh token in the database and check if it's revoked or expired
  const findRefreshToken = await prisma.refreshToken.findUnique({
    where: { id: refreshTokenId },
  });

  if (!findRefreshToken) {
    throw createError(401, "session not found or already invalidated");
  }

  if (findRefreshToken.revoked) {
    await prisma.refreshToken.deleteMany({
      where: { userId: findRefreshToken.userId },
    });
    throw createError(
      403,
      "Refresh token resused detected. All sessions have been logged out"
    );
  }

  constiisMatchRefreshToken = await argon2.verify(
    findRefreshToken.hashToken,
    refreshToken
  );
  if (!iisMatchRefreshToken) {
    throw createError(403, "Invalid refresh token");
  }

  // step 4: generate new access token and refresh token (and hash the new refresh token id)
  const payload = { sub: findRefreshToken.userId };
  const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  const newRefreshTokenId = uuidv4(); // generate unique id for refresh token
  const newPayloadRefreshToken = { jti: newRefreshTokenId };
  const newRefreshToken = jwt.sign(
    newPayloadRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  const hashedNewRefreshToken = await argon2.hash(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days and convert to milliseconds

  // step 5: update the database (revoked --> true old one) and hash the new refresh token id and store it in the database
  // use transaction to ensure both operations succeed or fail together
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.updateMany({
      where: { userId: refreshTokenId },
      data: { revoked: true },
    }); // mark old refresh token as revoked
  })

  await tx.refreshToken.create({
    data: {
      id: newRefreshTokenId,
      userId: findRefreshToken.userId,
      hashToken: hashedNewRefreshToken,
      expiresAt: expiresAt,                                     
    },
  });

  // step 6: send new refresh token to client in httpOnly cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
    sameSite: "strict", // protect CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days and convert to milliseconds
  });

  res.status(200).json({
    data: { accessToken: newAccessToken },
    message: "Token refreshed successfully",
    success: true,
  });
}
```
#### step 11.2 src/routers/auth.routes.js update
```js
import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";
import refreshTokenController from "../controllers/auth/refreshToken.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.post("/login", loginController) // generate access token and refresh token
authRouter.post("/refresh-token", refreshTokenController) // generate new access token using refresh token <-- update
authRouter.post("/logout", async (req, res) => {})

// Google OAuth
authRouter.get("/google", async (req, res) => {}) // redirect to google oauth consent screen
authRouter.get("/google/callback", async (req, res) => {}) // handle google oauth callback

// GitHub OAuth
authRouter.get("/github", async (req, res) => {}) // redirect to github oauth consent screen
authRouter.get("/github/callback", async (req, res) => {}) // handle github oauth callback

// Facebook OAuth
authRouter.get("/facebook", async (req, res) => {}) // redirect to facebook oauth consent screen
authRouter.get("/facebook/callback", async (req, res) => {}) // handle facebook oauth callback

export default authRouter;
```
### Step 12 Controller logout
#### step 12.1 src/controllers/logout.controller.js
```js
export default async function (req, res) {
  // There are main 2 jobs in logout controller
  // 1) clear refresh token assign revoked from flase to be true
  // 2) clear cookie in the client side

  // step 1: get refresh token from httpOnly cookie
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(200).json({
      data: null,
      message: "Already logged out",
      success: true,
    });
  }

  // step 2: verify refresh token
  let refreshTokenId;
  try {
    const payloadRefreshToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    refreshTokenId = payloadRefreshToken.jti; // get the jti (unique id) from the payload
  } catch (error) {
    // if token is invalid or expired, clear cookie and respond success
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
      sameSite: "strict", // protect CSRF
    });
    throw createError(401, "Invalid or expired refresh token");
  }
  // step 3: find the refresh token in the database
  const findRefreshToken = await prisma.refreshToken.findUnique({
    where: { id: refreshTokenId },
  });
  if (!findRefreshToken || findRefreshToken.revoked) {
    // if not found, clear cookie and respond success
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
      sameSite: "strict"// protect CSRF
    });
  }
  throw createError(401, "session not found or already invalidated");

  // step 4: mark the refresh token as revoked in the database
  await prisma.refreshToken.update({
    where: { id: refreshTokenId },
    data: { revoked: true },
  }); // mark as revoked

  // step 5: response by clear the refresh token cookie in the client side (clear cookie legally logout rather than just expire or invalid as in step 3 and above)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
    sameSite: "strict", // protect CSRF
  });

  res.status(200).json({
    data: null,
    message: "Logout successful",
    success: true,
  });
}
```
#### step 12.2 src/routers/auth.routes.js update
```js
import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";
import refreshTokenController from "../controllers/auth/refreshToken.controller.js";
import logoutController from "../controllers/auth/logout.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.post("/login", loginController) // generate access token and refresh token
authRouter.post("/refresh-token", refreshTokenController) // generate new access token using refresh token
authRouter.post("/logout", logoutController) // logout user and revoke refresh token <-- update

// Google OAuth
authRouter.get("/google", async (req, res) => {}) // redirect to google oauth consent screen
authRouter.get("/google/callback", async (req, res) => {}) // handle google oauth callback

// GitHub OAuth
authRouter.get("/github", async (req, res) => {}) // redirect to github oauth consent screen
authRouter.get("/github/callback", async (req, res) => {}) // handle github oauth callback

// Facebook OAuth
authRouter.get("/facebook", async (req, res) => {}) // redirect to facebook oauth consent screen
authRouter.get("/facebook/callback", async (req, res) => {}) // handle facebook oauth callback

export default authRouter;
```
### Step 13 Config middleware-passport for handle oauth
#### step 13.1 .env prepare inadvance
```js

NODE_ENV = "development"

# PORT used by the backend Express server
PORT=8887

DATABASE_URL="mysql://root:pooSQL123@localhost:3306/db_login_with_social_01"

CLIENT_URL="http://localhost:5173"

ACCESS_TOKEN_SECRET="myaccesstokensecret12345"
ACCESS_TOKEN_EXPIRY="15m"

REFRESH_TOKEN_SECRET="myrefreshtokensecret12345"
REFRESH_TOKEN_EXPIRY="7d"

GOOGLE_CLIENT_ID="51736579310-3u5u6u7b8u9u0u1u2u3u4u5u6u7u8u9u0.apps.googleusercontent.com" <-- prepare, but key is option
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnoqrstuvwxyz123456" <-- prepare, but key is option

GITHUB_CLIENT_ID="Iv1.abcdefghijklmno" <-- prepare, but key is option
GITHUB_CLIENT_SECRET="abcdefghijklmnoqrstuvwxyz123456" <-- prepare, but key is option

FACEBOOK_CLIENT_ID="123456789012345" <-- prepare, but key is option
FACEBOOK_CLIENT_SECRET="abcdefghijklmnoqrstuvwxyz123456" <-- prepare, but key is option
```
#### step 13.2 src/config/passport.config.js
```js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";

const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/v1/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        // This function is called after successful authentication with Google
        // You can use the profile information to find or create a user in your database
        return done(null, profile); // Pass the profile to the next middleware, null indicates no error
      }
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/v1/auth/github/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/v1/auth/facebook/callback`,
        profileFields: ["id", "displayName", "emails", "photos"], // Request email and name fields from Facebook
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  );
};

export default initializePassport;
```
#### step 13.3 app.js update // middleware
```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import mainRouter from './routers/main.routes.js';
import initializePassport from './config/passport.config.js';
import passport from 'passport';


const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})); // Enable CORS for the client URL

app.use(express.json()); // Prase JSON body, req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies, req.cookies

// set passport initialize
initializePassport(); <--- 1st input initializePassport to import initializePassport from './config/passport.config.js'
app.use(passport.initialize()); <--- 2nd input app.use(passport) to import passport from 'passport', then . initiallize

// API routes
app.use("/api/v1", mainRouter);

// not found route
// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `path not found ${req.method} ${req.url}` }); 
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
```
#### step 13.4 src/routers/auth.routes.js --> update at all oauth path
```js
import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";
import refreshTokenController from "../controllers/auth/refreshToken.controller.js";
import logoutController from "../controllers/auth/logout.controller.js";
import passport from "passport";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController); // generate access token and refresh token
authRouter.post("/refresh-token", refreshTokenController); // generate new access token using refresh token
authRouter.post("/logout", logoutController); // logout user and revoke refresh token

// Google OAuth
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
); // redirect to google oauth consent screen, revice token from google
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    // handle google oauth callback
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`, // redirect to login page if authentication fails
  }),
  (req, res) => {} // get req.user and send to controller for further processing
);

// GitHub OAuth
authRouter.get(
  "/github",
  passport.authenticate("github", { scope: ["user: email"] })
); // redirect to github oauth consent screen
authRouter.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`, // redirect to login page if authentication fails
  }),
  (req, res) => {} // get req.user and send to controller for further processing
);

// Facebook OAuth
authRouter.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
); // redirect to facebook oauth consent screen
authRouter.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`, // redirect to login page if authentication fails
  }),
  (req, res) => {} // get req.user and send to controller for further processing
); 

export default authRouter;
```