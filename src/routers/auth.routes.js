import { Router } from "express";
import loginController from "../controllers/auth/login.controller.js";
import registerController from "../controllers/auth/register.controller.js";
import refreshTokenController from "../controllers/auth/refreshToken.controller.js";
import logoutController from "../controllers/auth/logout.controller.js";
import passport from "passport";
import loginSocialController from "../controllers/auth/loginSocial.controller.js";

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
  }), // obtain req.user
  loginSocialController // call loginSocialController which will utilize of req.user
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
  }), // obtain req.user
  loginSocialController // call loginSocialController which will utilize of req.user
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
  }), // obtain req.user
  loginSocialController // call loginSocialController which will utilize of req.user
);

export default authRouter;
