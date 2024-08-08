import express, { Request, Response } from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  resetPassword,
  updatePassword,
  verifyOTP,
} from "../controllers/authController";
import passport from "passport";
import { isAuthenticated } from "../middlewares/auth";
import { sendToken } from "../utils/sendToken";
import { UserWithLocation } from "../@types/user";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", loginUser);

// Redirect to Google for authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: "http://localhost:3000/login?error=restaurant_exists",
  }),
  (req: Request, res: Response) => {
    console.log(req);
    if (req.user) {
      const user = req.user as UserWithLocation;
      const maxAge = Date.now() + 24 * 3 * 60 * 60 * 1000;
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
        expiresIn: maxAge,
      });
      res
        .cookie("jwtTokenAccess", token, {
          httpOnly: true,
          path: "/",
          secure: true,
          sameSite: "none",
        })
        .redirect("http://localhost:3000/callback?token=" + token);
    } else {
      res
        .status(400)
        .send("Unable to logged you in make sure the email is not register");
    }
  }
);

router.get("/logout", logoutUser);
router.post("/forget-password", forgotPassword);
router.put("/verify-otp", verifyOTP);
router.put("/password/reset", isAuthenticated, resetPassword);
router.put("/update-password", isAuthenticated, updatePassword);

export default router;
