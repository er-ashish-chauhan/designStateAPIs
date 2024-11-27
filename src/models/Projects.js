const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Projects = sequelize.define('Projects', {
    projectGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastAction: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "project_created"
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true, // Ensure timestamps are enabled
});

module.exports = Projects;
