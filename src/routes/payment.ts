import express from "express";
import {
  createRazorPayOrder,
  verifyRazorPayment,
} from "../controllers/paymentController";
const router = express.Router();

router.post("/create-order", createRazorPayOrder);
router.post("/verify-payment", verifyRazorPayment);

export default router;
