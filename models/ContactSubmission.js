const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ContactSubmission = sequelize.define('ContactSubmission', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = ContactSubmission;
