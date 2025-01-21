const ProjectGroups = require('./ProjectGroups');
const ProjectImageAIDetection = require('./ProjectImageAIDetection');
const ProjectImages = require('./ProjectImages');
const Projects = require('./Projects');
const UnityProgress = require('./UnityProgress');
const UserGallery = require('./UserGallery');

// Define associations
ProjectGroups.hasMany(Projects, { foreignKey: 'projectGroupId', as: 'projects' });
Projects.belongsTo(ProjectGroups, { foreignKey: 'projectGroupId', as: 'projectGroup' });

// Projects <-> ProjectImages (One project has many images)
Projects.hasMany(ProjectImages, { foreignKey: 'projectId', as: 'images' });
ProjectImages.belongsTo(Projects, { foreignKey: 'projectId', as: 'project' });

// ProjectImages <-> UserGallery (Link through imageId)
ProjectImages.belongsTo(UserGallery, { foreignKey: 'imageId', as: 'userGallery' });

// Projects <-> UnityProgress (Link through projectId)
Projects.hasMany(UnityProgress, { foreignKey: 'projectId', as: 'unityProgress' });
UnityProgress.belongsTo(Projects, { foreignKey: 'projectId', as: 'project' });

// Projects <-> ProjectImageAIDetection (Link through projectId and imageId)
ProjectImages.hasMany(ProjectImageAIDetection, { foreignKey: 'imageId', as: 'projectImageAIDetection' });
ProjectImageAIDetection.belongsTo(ProjectImages, { foreignKey: 'imageId', as: 'projectImage' });

module.exports = { ProjectGroups, Projects, ProjectImages, UserGallery, UnityProgress, ProjectImageAIDetection };
