const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectImageAIDetection = sequelize.define('ProjectImageAIDetection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imageId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    detections: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = ProjectImageAIDetection;
