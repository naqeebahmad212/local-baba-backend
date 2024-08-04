import express from "express";
import { UserWithLocation } from "../user";
import { Restaurant } from "../restaurant";

declare global {
  namespace Express {
    interface Request {
      user: any;
      costumeUser?: UserWithLocation | null;
      restaurant?: Restaurant | null;
    }
  }
}
