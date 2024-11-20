const ProjectGroups = require('./ProjectGroups');
const Projects = require('./Projects');

// Define associations
ProjectGroups.hasMany(Projects, { foreignKey: 'projectGroupId', as: 'projects' });
Projects.belongsTo(ProjectGroups, { foreignKey: 'projectGroupId', as: 'projectGroup' });

module.exports = { ProjectGroups, Projects };
