const { Sequelize } = require("sequelize");
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2020-08-27",
    appInfo: {
      name: "stripe-samples/checkout-single-subscription",
      version: "0.0.1",
      url: "https://github.com/stripe-samples/checkout-single-subscription",
    },
  }
);
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("SQLite connected");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sequelize, connectDB, stripe };
