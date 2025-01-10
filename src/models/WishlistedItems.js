const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Products = require('./Products');

const WishlistedItems = sequelize.define('WishlistedItems', {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
});

WishlistedItems.belongsTo(Products, {
    foreignKey: 'productId'
});

module.exports = WishlistedItems;
