import express from "express";
import {
  acceptOrder,
  changeAvailability,
  deliverOrder,
  getCurrentRiderDetails,
  getNearByOrders,
  getRevGraphData,
  getRiderNotifications,
  registerRider,
  riderDashboardStats,
  updateIdentification,
  updatePersonalDetails,
  updateVehicleDetails,
} from "../controllers/riderController";
import { isAuthenticated, isUserRoleAuthorize } from "../middlewares/auth";
const router = express.Router();
import multer from "multer";
import path from "path";
import { multerUpload } from "../utils/multer";

router.post("/register", registerRider);

router.get(
  "/current-rider",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  getCurrentRiderDetails
);

router.put(
  "/personal-details",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  multerUpload.single("profile"),
  updatePersonalDetails
);

router.put(
  "/identification",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  multerUpload.fields([
    { name: "idCardCopy", maxCount: 1 },
    { name: "drivingLicenseCopy", maxCount: 1 },
  ]),
  updateIdentification
);

router.put(
  "/vehicle-details",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  multerUpload.single("vehicleIdImage"),
  updateVehicleDetails
);

router.get(
  "/nearby-orders",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  getNearByOrders
);
router.put(
  "/accept-order",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  acceptOrder
);

router.put(
  "/deliver-order",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  deliverOrder
);
router.get(
  "/dashboard-stats",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  riderDashboardStats
);

router.get("/revenue-graph", isAuthenticated, getRevGraphData);

router.put(
  "/switch-available",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  changeAvailability
);

router.get(
  "/notifications",
  isAuthenticated,
  isUserRoleAuthorize("rider"),
  getRiderNotifications
);

export default router;
