const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectImages = sequelize.define('ProjectImages', {
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dimensions: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }
});

module.exports = ProjectImages;
