import express from "express";
import {
  getAllRestaurants,
  getCategories,
  getProductDetails,
  getProductsByCategory,
  getUserById,
  updateUserLocation,
} from "../controllers/globalController";
import { isAuthenticated } from "../middlewares/auth";
const router = express.Router();

router.post("/location", isAuthenticated, updateUserLocation);
router.get("/user/:id", getUserById);

router.get("/all-categories", isAuthenticated, getCategories);
router.get("/all-restaurants", isAuthenticated, getAllRestaurants);
router.get("/product-details/:id", isAuthenticated, getProductDetails);

router.get("/products-by-category", isAuthenticated, getProductsByCategory);

export default router;
