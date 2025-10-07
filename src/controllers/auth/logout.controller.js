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
