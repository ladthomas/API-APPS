const { stripe } = require("../config/db");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { default: axios } = require("axios");
const transporter = require("../config/mailer");
require("dotenv").config();

let redirectUrls = {}; // Utiliser une base de données dans un environnement de production

exports.getCheckoutSession = async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
};

exports.createCheckoutSession = async (req, res) => {
  const domainURL = process.env.DOMAINE;
  const { priceId, success_url, cancel_url, packageName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${domainURL}/payment/success?session_id={CHECKOUT_SESSION_ID}&uid=${req.userId}&packageName=${packageName}`,
      cancel_url: `${domainURL}/payment/cancel?session_id={CHECKOUT_SESSION_ID}&uid=${req.userId}`,
    });

    // Enregistrer les URLs
    redirectUrls[session.id] = { success_url, cancel_url };

    return res.status(200).send({ session });
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
};

exports.getConfig = (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    abonnemantList: [
      {
        idKey: "soloPrice",
        id: "price_1PX9aw2L8M07tj11NH7gVh6w",
        label: "Abonnement SOLO",
        description: "Description de l'abonnement 1",
        price: "€200.00",
      },
      {
        idKey: "duoPrice",
        id: "price_1PX9bc2L8M07tj117ikqjAhg",
        description: "Description de l'abonnement 2",
        label: "Abonnement DUO",
        price: "€400.00",
      },
      {
        idKey: "familyPrice",
        id: "price_1PX9c12L8M07tj11YRrf6oer",
        label: "Abonnement FAMILY",
        description: "Description de l'abonnement 3",
        price: "€600.00",
      },
    ],
  });
};

exports.createCustomerPortalSession = async (req, res) => {
  const { sessionId } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const returnUrl = process.env.DOMAIN;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });

  res.redirect(303, portalSession.url);
};

exports.handleWebhook = async (req, res) => {
  let data;
  let eventType;

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    data = req.body.data;
    eventType = req.body.type;
  }
  console.log(req.body);
  if (eventType === "checkout.session.completed") {
    console.log(`🔔  Payment received!`);
  }

  res.sendStatus(200);
};

// Nouvelle route pour le succès du paiement
exports.paymentSuccess = async (req, res) => {
  const { session_id, uid, packageName } = req.query;
  console.log({ session_id, uid, packageName });
  try {
    // Récupérer les informations de la session de paiement
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    // Mettre à jour les modèles User et Subscription
    const user = await User.findByPk(uid);

    if (user) {
      // Vérifier si une ligne active existe déjà
      const activeSubscription = await Subscription.findOne({
        where: {
          userId: user.id,
        },
      });

      if (!activeSubscription) {
        user.stripeCustomerId = session.customer;
        user.subscriptionPlan = packageName;
        user.subscriptionStart = new Date(
          subscription.current_period_start * 1000
        );
        user.subscriptionEnd = new Date(subscription.current_period_end * 1000);
        await user.save();

        await Subscription.create({
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          plan: packageName,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ),
          current_period_end: new Date(subscription.current_period_end * 1000),
        });
      }
    }

    const redirectUrl = redirectUrls[session_id]?.success_url;

    if (redirectUrl) {
      console.log(`Payment success for session: ${session_id}`);
      console.log(`Redirecting to: ${redirectUrl}`);
      res.redirect(303, redirectUrl);
    } else {
      res.status(400).send({ error: "Invalid session ID" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to process payment success" });
  }
};

// Nouvelle route pour l'annulation du paiement
exports.paymentCancel = (req, res) => {
  const { session_id } = req.query;
  const redirectUrl = redirectUrls[session_id]?.cancel_url;

  if (redirectUrl) {
    console.log(`Payment canceled for session: ${session_id}`);
    console.log(`Redirecting to: ${redirectUrl}`);
    res.redirect(303, redirectUrl);
  } else {
    res.status(400).send({ error: "Invalid session ID" });
  }
};
exports.cancelSubscription = async (req, res) => {
  const { userId } = req; // Assurez-vous que userId est envoyé depuis le front-end ou le client

  try {
    const user = await User.findByPk(userId);

    if (user) {
      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
        },
      });

      if (subscription) {
        // Annuler l'abonnement dans Stripe
        await cancelSubscriptionItem(subscription.stripeSubscriptionId);
        // Mettre à jour les informations de l'utilisateur
        user.subscriptionPlan = null;
        user.subscriptionStart = null;
        user.subscriptionEnd = null;

        // Supprimer l'entrée d'abonnement de la base de données locale
        await transporter.sendMail({
          from: "no-reply@example.com",
          to: user.email,
          subject: "Cancel subscription",
          text: `Votre abonnement qui a pour ID ${subscription.stripeSubscriptionId}`,
        });
        await user.save();
        await subscription.destroy();

        return res
          .status(200)
          .send({ message: "Subscription canceled successfully" });
      } else {
        return res
          .status(404)
          .send({ error: "No active subscription found for this user" });
      }
    } else {
      return res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).send({ error: "Failed to cancel subscription" });
  }
};

const cancelSubscriptionItem = async (subscriptionItemId) => {
  const secretKey = process.env.STRIPE_SECRET_KEY; // Remplacez par votre clé secrète Stripe

  try {
    const response = await axios.delete(
      `https://api.stripe.com/v1/subscription_items/${subscriptionItemId}`,
      {
        auth: {
          username: secretKey,
          password: "", // Il n'y a pas de mot de passe, laissez vide
        },
      }
    );

    console.log("Subscription item canceled:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error canceling subscription item:",
      error.response.data.error
    );
  }
};
