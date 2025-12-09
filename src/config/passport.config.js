import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";

// map the profile object received from passport strategy to a common format
const socialLoginVerify = (accessToken, refreshToken, profile, done) => {
  const normalizedProfile = {
    provider: profile.provider, // "google", "github", "facebook"
    providerId: profile.id, // unique id (number) from the provider
    email: null, // initialize email as null
    name: null, // initialize name as null
    coverImg: null, // initialize coverImg as null
  };

  console.log("profile from passport.config.js", profile) // to monitor key: profile recived from provide

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
      // normalizedProfile.coverImg = profile._json?.avatat_url; // get the first photo if exists
      normalizedProfile.coverImg = profile.photos?.[0]?.value || null; // get the first photo if exists
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
        callbackURL: `${process.env.GOOGLE_CALLBACK_URL}`,
      },
      // the original function signature is (accessToken, refreshToken, profile, done), as defined in passport documentation
      // then make common function to handle params "profile" received from different providers
      // orignal function is (accessToken, refreshToken, profile, done) => {
      //  return done(null, profile); return key "profile" and pass to common function socialLoginVerify
      // }
      socialLoginVerify // is the common function to handle profile from different providers, 
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.GITHUB_CALLBACK_URL}`,
      },
      socialLoginVerify
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${process.env.FACEBOOK_CALLBACK_URL}`,
        profileFields: ["id", "displayName", "emails", "photos"], // Request email and name fields from Facebook
        // 💡 เพิ่ม graphAPIVersion เพื่อแก้ปัญหาเวอร์ชันเก่า
        graphAPIVersion: 'v19.0', // หรือเวอร์ชันล่าสุดที่รองรับ
      },
      socialLoginVerify
    )
  );
};

export default initializePassport;
