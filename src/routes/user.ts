import express from "express";
import {
  addProductRestaurantAndRiderReview,
  cancelOrder,
  getAllRestaurants,
  getCategories,
  getCurrentUserDetails,
  getDiscountedRestaurants,
  getIndexPage,
  getNearByRestaurants,
  getProductDetails,
  getRestaurantProducts,
  getSingleOrderInfo,
  getTopRatedRestaurants,
  getUserNotifications,
  getUserOrders,
  placeOrder,
  registerUser,
  updateProfile,
} from "../controllers/userController";
import {
  isAuthenticated,
  isRestaurantApproved,
  isUserRoleAuthorize,
} from "../middlewares/auth";
import path from "path";
import multer from "multer";
import { multerUpload } from "../utils/multer";

const router = express.Router();

router.post("/register", registerUser);

router.get("/current-user", isAuthenticated, getCurrentUserDetails);

router.get("/all-categories", isAuthenticated, getCategories);
router.get("/all-restaurants", isAuthenticated, getAllRestaurants);
router.get(
  "/discounted-restaurants",
  isAuthenticated,
  getDiscountedRestaurants
);
// get near by restaurants with in 1km
router.put("/near-by", isAuthenticated, getNearByRestaurants);

// get the product of a particular restaurant
router.get("/restaurant-products/:id", isAuthenticated, getRestaurantProducts);
router.get("/product-details/:id", isAuthenticated, getProductDetails);
router.post("/place-order", isAuthenticated, placeOrder);
router.get("/orders", isAuthenticated, getUserOrders);
router.get("/order-info/:id", isAuthenticated, getSingleOrderInfo);
router.put("/cancel-order/:id", isAuthenticated, cancelOrder);
router.put(
  "/update-profile",
  isAuthenticated,
  multerUpload.single("profile"),
  updateProfile
);

router.put(
  "/add-review",
  isAuthenticated,
  isUserRoleAuthorize("costumer"),
  addProductRestaurantAndRiderReview
);

router.get("/top-rated-restaurants", getTopRatedRestaurants);

router.get(
  "/notifications",
  isAuthenticated,
  isUserRoleAuthorize("costumer"),
  getUserNotifications
);

export default router;
