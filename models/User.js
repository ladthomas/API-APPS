const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  stripeCustomerId: { type: DataTypes.STRING },
  subscriptionPlan: { type: DataTypes.STRING },
  subscriptionStart: { type: DataTypes.DATE },
  subscriptionEnd: { type: DataTypes.DATE },
});

module.exports = User;