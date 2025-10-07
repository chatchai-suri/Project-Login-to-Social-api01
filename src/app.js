import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import mainRouter from './routers/main.routes.js';
import initializePassport from './config/passport.config.js';
import passport from 'passport';


const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})); // Enable CORS for the client URL

app.use(express.json()); // Prase JSON body, req.body

app.use(cookieParser()); // Parse Cookie header and populate req.cookies, req.cookies

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
