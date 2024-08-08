// passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import { UserWithLocation } from "../@types/user";
import dotenv from "dotenv";
import Restaurant from "../models/restaurantModal";
dotenv.config();

// Configure Passport to use Google OAuth 2.0
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: Function
    ) => {
      try {
        // Find or create the user in the database
        let user: UserWithLocation | null = await User.findOne({
          email: profile.emails[0].value,
        });

        if (!user) {
          let restaurant = await Restaurant.findOne({
            email: profile.emails[0].value,
          });
          if (restaurant) {
            // If restaurant exists, respond with conflict
            return done(null, false, {
              message: "Restaurant already exists with this email.",
            });
          }

          // If user doesn't exist, create a new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        // // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
          expiresIn: "1h",
        });

        // Pass user and token to the next middleware
        done(null, { user, token });
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user to store in the session
passport.serializeUser((user: any, done: Function) => {
  done(null, user.user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done: Function) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
