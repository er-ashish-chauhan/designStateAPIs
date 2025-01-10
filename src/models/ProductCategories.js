const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductCategories = sequelize.define('ProductCategories', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  }
});

module.exports = ProductCategories;
