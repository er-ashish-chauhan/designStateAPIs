const ProjectGroups = require('./ProjectGroups');
const ProjectImages = require('./ProjectImages');
const Projects = require('./Projects');
const UserGallery = require('./UserGallery');

// Define associations
ProjectGroups.hasMany(Projects, { foreignKey: 'projectGroupId', as: 'projects' });
Projects.belongsTo(ProjectGroups, { foreignKey: 'projectGroupId', as: 'projectGroup' });

// Projects <-> ProjectImages (One project has many images)
Projects.hasMany(ProjectImages, { foreignKey: 'projectId', as: 'images' });
ProjectImages.belongsTo(Projects, { foreignKey: 'projectId', as: 'project' });

// ProjectImages <-> UserGallery (Link through imageId)
ProjectImages.belongsTo(UserGallery, { foreignKey: 'imageId', as: 'userGallery' });

module.exports = { ProjectGroups, Projects, ProjectImages, UserGallery };
