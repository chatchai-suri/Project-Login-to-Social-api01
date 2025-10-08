import createError from "../../utils/createError.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../../config/prisma.config.js";
import { preprocess } from "zod";

// this controller will handle the user profile received from passport after successful social login
// and plan to use as common controller for all social login (google, github, facebook)
// therefore, the passport middleware must respond with req.user containing the user profile as common format, see config/passport.config.js
export default async function (req, res) {
  const userProfile = req.user;

  // step 1: validate the user profile received from passport
  if (!userProfile) {
    throw createError(400, "User profile not found afrer social login");
  }

  if (!userProfile.email) {
    return res.redirect(
      `${process.env.CLIENT_URL}/login/error?message=Email not found from ${userProfile.provider}`
    );
  }
  // step 2: check if user with the email already exists in the database
  // there are 3 cases:
  // case 1: account with the email already exists with the same provider (e.g., google)
  // case 2: account not exists, but user is existing with different provider (e.g., github, facebook) --> we will create new account with the new provider and link to the existing user
  // case 3: account not exists, and user not exists --> we will create new user and new account
  const user = await prisma.$transaction(async (tx) => {
    // use transaction to ensure all operations are atomic (all succeed or all fail)
    // find account with the email and provider
    let account = await tx.account.findUnique({
      where: {
        provider_providerId: {
          provider: userProfile.provider, // e.g., "google"
          providerId: userProfile.providerId, // e.g., "1234567890"
        },
      },
      include: { user: { omit: { password: true } } }, // include the related user data in the result
    });
    // case 1: account with the email and provider already exists
    if (account) {
      return account.user; // return the existing user, return case 1 of step 2
    }

    // case 2: account not exists, but user is existing with different provider
    let existUser = await tx.user.findUnique({
      where: { email: userProfile.email },
      omit: { password: true }, // exclude password field from the result
    });
    if (existUser) {
      // create new account linked to the existing user
      account = await tx.account.create({
        data: {
          userId: existUser.id,
          type: "oauth",
          provider: userProfile.provider,
          providerId: userProfile.providerId,
        },
      });
      return existUser; // return the existing user (we do not update the existing user profile to avoid overwriting existing data), return case 2 of step 2
    }

    // case 3: account not exists, and user not exists
    // create new user and new account
    const newUser = await tx.user.create({
      data: {
        email: userProfile.email,
        name: userProfile.name,
        coverImg: userProfile.coverImg,
      },
      omit: { password: true }, // exclude password field from the result
    });

    await tx.account.create({
      data: {
        userId: newUser.id,
        type: "oauth",
        provider: userProfile.provider,
        providerId: userProfile.providerId,
      },
    });
    return newUser; // return the newly created user of case 3 of step 2
  }); // assign the result of the transaction to user and end of step 2

  // step 3: generate access token and refresh token for the user (same as login controller)
  const payload = { sub: user.id };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  const refreshTokenId = uuidv4(); // generate unique id for refresh token
  const refreshToken = jwt.sign(
    { jti: refreshTokenId },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );

  // step 4: hash and store the refresh token id in the database
  const hashedRefreshToken = await argon2.hash(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days and convert to milliseconds

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      hashToken: hashedRefreshToken,
      expiresAt: expiresAt,
    }
  })

  // step 5: respond by setting the refresh token in httpOnly cookie and redirect to client with access token in query parameter
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set secure flag in production, via HTTPS
    sameSite: "strict", // protect CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days and convert to milliseconds
  });

  // redirect to frontend, path must defind
  res.redirect(`${preprocess.env.CLIENT_URL}/oauth-callback?accessToken=${accessToken}`)

} //end of controller
