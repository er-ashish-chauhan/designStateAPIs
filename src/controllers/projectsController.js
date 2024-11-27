const sequelize = require('../config/db');
const { Projects, ProjectGroups, ProjectImages, UserGallery } = require('../models/associations');

const { formatResponse } = require('../utils/formatResponse');

exports.getAllGroups = async (req, res) => {
    try {
        const userId = req.user.id; // Retrieve userId from token (req.user set by auth middleware)

        // Fetch all project groups for the user
        const groups = await ProjectGroups.findAll({
            where: { userId: userId, deleted: false },
        });

        if (groups.length === 0) {
            return res.status(404).json(formatResponse(null, "No project groups exist.", false));
        }

        // Fetch the last updated project for each group and the total number of projects in each group
        const groupData = await Promise.all(
            groups.map(async (group) => {
                // Find the last updated project for each group
                const lastUpdatedProject = await Projects.findOne({
                    where: {
                        projectGroupId: group.id,
                        deleted: false,
                    },
                    order: [['updatedAt', 'DESC']],
                    attributes: ['id', 'projectGroupId', 'name', 'type', 'updatedAt'],
                    include: [
                        {
                            model: ProjectImages,
                            as: 'images',
                            where: { deleted: false },
                            required: false,
                            attributes: ['id', 'imageId', 'dimensions'],
                            include: [
                                {
                                    model: UserGallery,
                                    as: 'userGallery',
                                    attributes: ['imageUrl'],
                                },
                            ],
                        },
                    ],
                });

                // Count total number of projects for the group
                const totalProjectsCount = await Projects.count({
                    where: {
                        projectGroupId: group.id,
                        deleted: false,
                    },
                });

                // Transform project images to include imageUrl from UserGallery
                const transformedProject = lastUpdatedProject
                    ? {
                        ...lastUpdatedProject.toJSON(),
                        images: lastUpdatedProject.images.map((image) => ({
                            id: image.id,
                            imageId: image.imageId,
                            dimensions: image.dimensions,
                            imageUrl: image.userGallery ? image.userGallery.imageUrl : null,
                        })),
                    }
                    : null;
                
                return {
                    id: group.id,
                    name: group.name,
                    userId: group.userId,
                    totalProjectsCount: totalProjectsCount,  // Add total project count here
                    project: transformedProject,
                };
            })
        );

        res.status(200).json(formatResponse(groupData, "Project groups and projects fetched successfully.", true));
    } catch (error) {
        res.status(500).json(formatResponse(null, error.message, false));
    }
};

// create project
exports.createProject = async (req, res) => {
    const { groupId, groupName, name, type } = req.body;

    try {
        const userId = req.user.id; // Retrieve userId from token (req.user set by auth middleware)

        let finalGroupId = groupId;

        // If groupId is null, create a new group
        if (!groupId) {
            if (!groupName) {
                return res
                    .status(400)
                    .json(formatResponse(null, "Group name is required when groupId is null.", false));
            }

            // Create a new group
            const newGroup = await ProjectGroups.create({ name: groupName, userId: userId, deleted: false });
            finalGroupId = newGroup.id;
        } else {
            // Validate existing groupId
            const existingGroup = await ProjectGroups.findOne({
                where: { id: groupId, deleted: false },
            });

            if (!existingGroup) {
                return res.status(404).json(formatResponse(null, "Project group not found or deleted.", false));
            }
        }

        // Create a new project with the finalGroupId
        const newProject = await Projects.create({
            projectGroupId: finalGroupId,
            name,
            type,
        });

        res
            .status(201)
            .json(formatResponse(newProject, "Project created successfully.", true));
    } catch (error) {
        res
            .status(500)
            .json(formatResponse(null, error.message, false));
    }
};

// get projects list by group id
exports.getProjectsByGroup = async (req, res) => {
    const { projectGroupId } = req.params;

    try {
        // Check if projectGroupId is provided
        if (!projectGroupId) {
            return res
                .status(400)
                .json(formatResponse(null, "Project group ID is required.", false));
        }

        // Find the project group
        const group = await ProjectGroups.findOne({
            where: { id: projectGroupId, deleted: false },
        });

        // If group doesn't exist or is marked as deleted
        if (!group) {
            return res
                .status(404)
                .json(formatResponse(null, "Project group not found.", false));
        }

        // Fetch projects with their images and associated UserGallery
        const projects = await Projects.findAll({
            where: { projectGroupId: projectGroupId, deleted: false },
            attributes: ['id', 'projectGroupId', 'name', 'type'],
            include: [
                {
                    model: ProjectImages,
                    as: 'images',
                    where: { deleted: false },
                    required: false, // Include projects even if no images are present
                    attributes: ['id', 'imageId', 'dimensions', 'type'],
                    include: [
                        {
                            model: UserGallery,
                            as: 'userGallery',
                            attributes: ['imageUrl'], // Fetch only the imageUrl field
                        }
                    ]
                }
            ],
        });

        // Transform the response to place `imageUrl` at the top level of each image
        const transformedProjects = projects.map(project => ({
            ...project.toJSON(),
            images: project.images.map(({
                userGallery,
                id,
                imageId,
                dimensions,
                type
            }) => ({
                id,
                imageId,
                dimensions,
                type,
                imageUrl: userGallery ? userGallery.imageUrl : null // Extract imageUrl
            }))
        }));

        // Prepare the final response
        const response = {
            groupId: group.id,
            groupName: group.name,
            projects: transformedProjects,
        };

        res
            .status(200)
            .json(formatResponse(response, "Projects fetched successfully.", true));
    } catch (error) {
        console.error("Error fetching projects by group:", error);
        res
            .status(500)
            .json(formatResponse(null, error.message, false));
    }
};

// delete project by project id
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params; // Get project ID from request parameters

        // Find the project by ID
        const project = await Projects.findOne({ where: { id } });

        if (!project) {
            return res.status(404).json(formatResponse(null, "Project not found.", false));
        }

        // Update the 'deleted' flag to true
        await project.update({ deleted: true });

        res.status(200).json(formatResponse({
            projectId: id
        }, "Project deleted successfully.", true));
    } catch (error) {
        res.status(500).json(formatResponse(null, error.message, false));
    }
};

// delete project group by group id
exports.deleteProjectGroup = async (req, res) => {
    try {
        const { id } = req.params; // Get project group ID from request parameters

        // Find the project group by ID
        const projectGroup = await ProjectGroups.findOne({ where: { id } });

        if (!projectGroup) {
            return res.status(404).json(formatResponse(null, 'Project group not found.', false));
        }

        // Update the 'deleted' flag for all associated projects
        await Projects.update(
            { deleted: true }, // Set 'deleted' flag to true
            { where: { projectGroupId: id } } // Filter by project group ID
        );

        // Update the 'deleted' flag for the project group
        await projectGroup.update({ deleted: true });

        res.status(200).json(formatResponse(null, 'Project group and associated projects deleted successfully.', true));
    } catch (error) {
        res.status(500).json(formatResponse(null, error.message, false));
    }
};

// Save Project Image API
exports.saveProjectImage = async (req, res) => {
    try {
        // Helper function to validate an individual image
        const validateImage = (image) => {
            if (!image.projectId || !image.imageId || !image.dimensions) {
                return 'projectId, imageUrl, and dimensions are required for each image.';
            }
            if (typeof image.dimensions !== 'object' || !image.dimensions.l || !image.dimensions.w || !image.dimensions.h) {
                return 'Dimensions must be an object with l (length), w (width), and h (height).';
            }
            return null; // No errors
        };

        // Check if input is an array or an object
        const image = req.body;
        const error = validateImage(image);
        if (error) {
            return res.status(400).json(formatResponse(null, error, false));
        }

        const imageName = image?.name ?? image.imageUrl.split('/').pop();
        // Process and save images
        const newImage = await ProjectImages.create({
            projectId: image.projectId,
            imageId: image.imageId,
            name: imageName,
            type: image.type,
            dimensions: image.dimensions,
        });

        await updateProjectAction(image.projectId, "image_added");

        // Remove the `deleted` field before sending response
        const { deleted, ...responseData } = newImage.toJSON();
        res.status(201).json(formatResponse(responseData, 'Project image saved successfully.', true));
    } catch (error) {
        console.error('Error saving image(s):', error);
        res.status(500).json(formatResponse(null, error.message, false));
    }
};

// get project images API
exports.getImagesForProject = async (req, res) => {
    try {
        const { projectId } = req.params; // Get the projectId from URL parameter

        // Validate projectId
        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project ID is required' });
        }

        // Find the project to ensure it exists
        const project = await Projects.findByPk(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Get all images for the project where deleted = false
        const images = await ProjectImages.findAll({
            where: {
                projectId: projectId,
                deleted: false, // Only non-deleted images
            },
            include: {
                model: UserGallery,
                as: 'userGallery', // Assuming the association is defined as 'userGallery'
                attributes: ['imageUrl'], // Fetch only the imageUrl field
            },
        });

        if (images.length === 0) {
            return res.status(404).json({ success: false, message: 'No images found for this project' });
        }

        // Prepare the response with project images and user gallery URLs
        const responseData = images.map((image) => {
            const { userGallery, ...imageData } = image.toJSON(); // Extract image data and associated user gallery
            return {
                ...imageData,
                imageUrl: userGallery ? userGallery.imageUrl : null, // If userGallery exists, include the imageUrl
            };
        });

        // Return the images
        return res.status(200).json({
            success: true,
            message: 'Images fetched successfully',
            data: responseData,
        });

    } catch (error) {
        console.error('Error fetching project images:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch images', error: error.message });
    }
};

// update project date 
const updateProjectAction = async (projectId, lastAction) => {
    try {
        const project = await Projects.findByPk(projectId);
        if (!project) {
            console.log('Project not found:', projectId);
            return;
        }

        const [affectedRows] = await Projects.update(
            {
                lastAction
            },
            {
                where: { id: projectId }, // Correct placement of `where`
                silent: false, // Moved out of the `where` clause
                logging: console.log
            }
        );

        if (affectedRows === 0) {
            console.log('No project found or updated.', projectId);
        } else {
            console.log('Project updated successfully.');
        }
    } catch (error) {
        console.error('Error updating project timestamp:', error);
    }
};

