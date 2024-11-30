const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserGallery = sequelize.define('UserGallery', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: null
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: null
  },
  dimensionUnit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: null
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});


module.exports = UserGallery;
