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
