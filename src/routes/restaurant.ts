import express from "express";
import {
  getRestaurantNotifications,
  restaurantDashboardStats,
  getRestaurantProducts,
  getRestaurantReviews,
  getRestaurantOrders,
  registerRestaurant,
  restaurantDetails,
  getOrderMapData,
  loginRestaurant,
  uploadLegalCopy,
  updateProduct,
  addNewProduct,
  getOrderInfo,
  ownerDetails,
  updateOrder,
  getYearsComparison,
} from "../controllers/restaurantController";
import {
  isAuthenticated,
  isRestaurantApproved,
  isUserRoleAuthorize,
} from "../middlewares/auth";
const router = express.Router();
import multer from "multer";
import path from "path";
import { getSingleOrderInfo } from "../controllers/userController";
import { multerUpload } from "../utils/multer";

router.post("/register", registerRestaurant);
router.post("/login", loginRestaurant);
router.post(
  "/details",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  multerUpload.single("profile"),
  restaurantDetails
);
router.post(
  "/owner-details",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  multerUpload.single("profile"),
  ownerDetails
);
router.post(
  "/legal-doc",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  multerUpload.single("legalCopy"),
  uploadLegalCopy
);

router.post(
  "/add-product",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  multerUpload.single("productImage"),
  addNewProduct
);

router.put(
  "/update-product",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  multerUpload.single("productImage"),
  updateProduct
);

router.get(
  "/dashboard-stats",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  restaurantDashboardStats
);

router.get(
  "/order-map-data",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getOrderMapData
);
router.get(
  "/graph-data",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getYearsComparison
);

router.get(
  "/reviews",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getRestaurantReviews
);

router.get(
  "/order/:id",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getOrderInfo
);

router.get(
  "/products",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getRestaurantProducts
);

router.get(
  "/notifications",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getRestaurantNotifications
);

router.get(
  "/orders",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  getRestaurantOrders
);

router.put(
  "/update-order",
  isAuthenticated,
  isUserRoleAuthorize("restaurant"),
  isRestaurantApproved,
  updateOrder
);

export default router;
