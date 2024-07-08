const express = require("express");
const router = express.Router();
const {
  createSubscription,
  handleWebhook,
  createPaymentLink,
  createCustomerPortalLink,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");
const stripeController = require("../controllers/stripeController");

router.get("/checkout-session", stripeController.getCheckoutSession);
router.post(
  "/create-checkout-session",
  authMiddleware,
  stripeController.createCheckoutSession
);
router.get("/config", stripeController.getConfig);
router.post("/customer-portal", stripeController.createCustomerPortalSession);
router.post("/webhook", stripeController.handleWebhook);
router.get("/payment/success", stripeController.paymentSuccess);
router.get("/payment/cancel", stripeController.paymentCancel);
router.get(
  "/cancelSubscription",
  authMiddleware,
  stripeController.cancelSubscription
);

module.exports = router;
