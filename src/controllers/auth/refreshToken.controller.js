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
