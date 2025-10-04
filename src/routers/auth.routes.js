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