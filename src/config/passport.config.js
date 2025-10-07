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
