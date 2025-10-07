import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";
import refreshTokenController from "../controllers/auth/refreshToken.controller.js";
import logoutController from "../controllers/auth/logout.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.post("/login", loginController) // generate access token and refresh token
authRouter.post("/refresh-token", refreshTokenController) // generate new access token using refresh token
authRouter.post("/logout", logoutController) // logout user and revoke refresh token

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