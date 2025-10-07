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
  }); // exclude password, createdAt, updatedAt fields from the result

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
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });

  const refreshTokenId = uuidv4(); // generate unique id for refresh token 
  const refreshToken = jwt.sign({ jti:refreshTokenId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

// step 5: hash the refresh token id and store it in the database
  const hashedRefreshToken = await argon2.hash(refreshToken);
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000); // 7 days and convert to milliseconds 

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      hashToken: hashedRefreshToken,
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