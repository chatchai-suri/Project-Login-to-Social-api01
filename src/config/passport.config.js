import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";

// map the profile object received from passport strategy to a common format
const socialLoginVerify = (accessToken, refreshToken, profile, done) => {
  const normalizedProfile = {
    provider: profile.provider, // "google", "github", "facebook"
    providerId: profile.providerId, // unique id (number) from the provider
    email: null, // initialize email as null
    name: null, // initialize name as null
    coverImg: null, // initialize coverImg as null
  };

  console.log("profile", profile) // to monitor key: profile recived from provide

  // extract email and name based on provider, by switch case
  switch (profile.provider) {
    case "google":
      normalizedProfile.email = profile.emails?.[0]?.value || null; // get the first email if exists
      normalizedProfile.name = profile.displayName || null;
      normalizedProfile.coverImg = profile.photos?.[0]?.value || null; // get the first photo if exists
      break;

    case "facebook":
      normalizedProfile.email = profile.emails?.[0]?.value || null; // get the first email if exists
      normalizedProfile.name = profile.displayName || null;
      normalizedProfile.coverImg = profile.photos?.[0]?.value || null; // get the first photo if exists
      break;

    case "github":
      normalizedProfile.email = profile.emails?.[0]?.value || null; // get the first email if exists
      normalizedProfile.name = profile.displayName ?? profile.username; // use displayName if exists, otherwise use username
      normalizedProfile.coverImg = profile._json?.avatat_url; // get the first photo if exists
      break;
  }

  return done(null, normalizedProfile); // null indicates no error, pass the normalized profile to the next middleware or controller as req.user
};

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
      },
      socialLoginVerify
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/api/v1/auth/github/callback`,
      },
      socialLoginVerify
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
      socialLoginVerify
    )
  );
};

export default initializePassport;
