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
});


module.exports = UserGallery;
