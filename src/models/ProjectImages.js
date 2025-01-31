const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectImages = sequelize.define('ProjectImages', {
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    imageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    aiImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    name: {
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
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

module.exports = ProjectImages;
