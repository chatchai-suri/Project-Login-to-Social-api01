import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import mainRouter from './routers/main.routes.js';
import initializePassport from './config/passport.config.js';
import passport from 'passport';
import session from 'express-session';


const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})); // Enable CORS for the client URL

app.use(express.json()); // Prase JSON body, req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies, req.cookies

// set up express-session middleware before passport session
// Session is required for OAuth2 state management, not for persistent login sessions
// still app is stateless as we do not use passport session management
app.use(session({
  secret: process.env.ACCESS_TOKEN_SECRET || 'secret_key_for_oauth_state', // any secret key for signing the session ID cookie
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true on production
    maxAge: 60000 // just 1 min for logging purpose
  }
}));

// set passport initialize
initializePassport();
app.use(passport.initialize());

// API routes
app.use("/api/v1", mainRouter);

// not found route
// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `path not found ${req.method} ${req.url}` }); 
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
