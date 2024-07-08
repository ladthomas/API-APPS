const { sequelize } = require('../config/db');
const User = require('./User');
const News = require('./News');
const Subscription = require('./Subscription');

const initModels = async () => {
  await sequelize.sync({ force: false });
};

module.exports = { initModels, User, News, Subscription };
