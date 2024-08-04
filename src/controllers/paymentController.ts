import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay } from "../utils/razorpay";
import crypto from "crypto";
import { generateReceiptNumber } from "../utils";

export const createRazorPayOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const options = {
      amount: req.body.amount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: generateReceiptNumber(),
      payment_capture: 1,
    };

    try {
      const response = await razorpay.orders.create(options);
      res.json({
        success: true,
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
);

export const verifyRazorPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { order_id, payment_id, signature } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.KEY_SECRET!)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generated_signature === signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  }
);
