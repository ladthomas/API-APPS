const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Subscription = sequelize.define("Subscription", {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  stripeSubscriptionId: { type: DataTypes.STRING },
  plan: { type: DataTypes.STRING },
  current_period_start: { type: DataTypes.DATE },
  current_period_end: { type: DataTypes.DATE },
});

module.exports = Subscription;
