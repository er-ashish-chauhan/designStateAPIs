const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectGroups = sequelize.define('ProjectGroups', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

module.exports = ProjectGroups;
