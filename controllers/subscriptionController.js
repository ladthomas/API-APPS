const stripe = require("stripe")(
  "sk_test_51PTTPg2L8M07tj11V8XwO0tLs7xVjXXFCmVptweclYA3vitP6TokIZn9lOrBvWSgadvdHhTSKl7I9K7IHqNV502T00gPs0jHU1",
  {
    apiVersion: "2020-08-27",
    appInfo: {
      // For sample support and debugging, not required for production:
      name: "stripe-samples/checkout-single-subscription",
      version: "0.0.1",
      url: "https://github.com/stripe-samples/checkout-single-subscription",
    },
  }
);
const { User } = require("../models");
const transporter = require("../config/mailer");

exports.createPaymentLink = async (req, res) => {
  const { priceId } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.createCustomerPortalLink = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: "User is not subscribed" });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  switch (event.type) {
    case "customer.subscription.created":
      // Handle subscription creation
      break;
    case "customer.subscription.deleted":
      // Handle subscription cancellation
      break;
    // Add other event types as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: "User is not subscribed" });
    }
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
    });
    const subscription = subscriptions.data[0];
    if (!subscription) {
      return res.status(400).json({ message: "No subscription found" });
    }
    await stripe.subscriptions.del(subscription.id);
    transporter.sendMail({
      from: "no-reply@example.com",
      to: user.email,
      subject: "Subscription Cancelled",
      text: `Hello ${user.name}, your subscription has been cancelled.`,
    });
    res.json({ message: "Subscription cancelled" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.createSubscription = async (req, res) => {
  const { planId } = req.body;
  try {
    const user = await User.findByPk(req.userId);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id.toString() },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: planId }],
      expand: ["latest_invoice.payment_intent"],
    });
    user.stripeCustomerId = customer.id;
    user.subscriptionPlan = planId;
    user.subscriptionStart = new Date(subscription.current_period_start * 1000);
    user.subscriptionEnd = new Date(subscription.current_period_end * 1000);
    await user.save();
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.handleWebhook = async (req, res) => {
  const event = req.body;
  switch (event.type) {
    case "customer.subscription.updated":
      const subscription = event.data.object;
      const user = await User.findOne({
        where: { stripeCustomerId: subscription.customer },
      });
      if (user) {
        user.subscriptionStart = new Date(
          subscription.current_period_start * 1000
        );
        user.subscriptionEnd = new Date(subscription.current_period_end * 1000);
        await user.save();
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.send();
};
