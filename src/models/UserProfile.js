const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = UserProfile;
