const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UnityProgress = sequelize.define('UnityProgress', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sessionData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    modelPlacements: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
});


module.exports = UnityProgress;
