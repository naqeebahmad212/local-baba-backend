import express from "express";
import {
  acceptRestaurant,
  acceptRider,
  addCategory,
  adminDashboardStats,
  deleteCategory,
  getCustomers,
  getPendingRestaurants,
  getPendingRiders,
  getRestaurantDetails,
  getRestaurants,
  getRiderDetails,
  getRiders,
  ordersListAndHistory,
} from "../controllers/adminController";
import multer from "multer";
import { isAuthenticated, isUserRoleAuthorize } from "../middlewares/auth";
import { multerUpload } from "../utils/multer";
import {
  getSingleOrderInfo,
  updateProfile,
} from "../controllers/userController";

const router = express.Router();

router.post(
  "/add-category",
  multerUpload.single("category-image"),
  addCategory
);

router.delete(
  "/delete-category/:id",
  isUserRoleAuthorize("admin"),
  deleteCategory
);
router.get(
  "/dashboard-stats",
  isUserRoleAuthorize("admin"),
  adminDashboardStats
);
router.get(
  "/orders-list-and-history",
  isUserRoleAuthorize("admin"),
  ordersListAndHistory
);

router.get("/order/:id", isAuthenticated, getSingleOrderInfo);

router.get("/customers", isAuthenticated, getCustomers);

router.get(
  "/restaurants",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  getRestaurants
);

router.get(
  "/pending-restaurants",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  getPendingRestaurants
);

router.get(
  "/restaurant/:id",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  getRestaurantDetails
);

router.get("/riders", isAuthenticated, isUserRoleAuthorize("admin"), getRiders);
router.get(
  "/pending-riders",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  getPendingRiders
);

router.get(
  "/rider/:id",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  getRiderDetails
);

router.put(
  "/accept-rider/:id",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  acceptRider
);

router.put(
  "/accept-restaurant/:id",
  isAuthenticated,
  isUserRoleAuthorize("admin"),
  acceptRestaurant
);

router.put(
  "/update-profile",
  isAuthenticated,
  multerUpload.single("profile"),
  updateProfile
);
export default router;
