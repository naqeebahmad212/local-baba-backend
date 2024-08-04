import express, { Application, Request } from "express";
import dotenv from "dotenv";
import logger from "./utils/logger";
import errorHandler from "./middlewares/errorHandler";
import { connectToDB } from "./config/database";
import userRouter from "./routes/user";
import riderRouter from "./routes/rider";
import restaurantRouter from "./routes/restaurant";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import productRouter from "./routes/product";
import globalRouter from "./routes/global";
import cookieParser from "cookie-parser";
import "./services/passport";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { initializeSocketIO } from "./utils/socketIo";
const app: Application = express();
const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["*"],
//   },
// });
initializeSocketIO(server);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["POST", "GET", "PUT", "DELETE"],
  })
);

// Load environment variables from .env file
dotenv.config();

// Connect to database
connectToDB();

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("shuntting down the server due to uncaugth");

  process.exit(1);
});

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/rider", riderRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/global", globalRouter);

app.use(errorHandler);
