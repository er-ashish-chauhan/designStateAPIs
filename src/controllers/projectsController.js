const { default: axios } = require('axios');
const sequelize = require('../config/db');
const { Projects, ProjectGroups, ProjectImages, UserGallery, UnityProgress, ProjectImageAIDetection } = require('../models/associations');

const { formatResponse } = require('../utils/formatResponse');

exports.getAllGroups = async (req, res) => {
    try {
        const userId = req.user.id; // Retrieve userId from token (req.user set by auth middleware)

        // Fetch all project groups for the user
        const groups = await ProjectGroups.findAll({
            where: { userId: userId, deleted: false },
        });

        if (groups.length === 0) {
            return res.status(200).json(formatResponse(null, "No project groups exist.", false));
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
            lastAction: "project_created"  // Set initial lastAction
        });

        await updateProjectAction(newProject.id, "project_created");

        res
            .status(200)
            .json(formatResponse(newProject, "Project created successfully.", true));
    } catch (error) {
        res
            .status(500)
            .json(formatResponse(null, error.message, false));
    }
};

// Get projects list by group id with pagination
exports.getProjectsByGroup = async (req, res) => {
    const projectGroupId = parseInt(req.query.groupId);
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
    const pageSize = parseInt(req.query.pageSize) || 10;  // Default to 10 items per page if not provided
    const offset = (page - 1) * pageSize;  // Calculate offset for pagination

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
                .status(200)
                .json(formatResponse(null, "Project group not found.", false));
        }

        // Fetch the total count of projects for pagination metadata
        const totalProjects = await Projects.count({
            where: { projectGroupId: projectGroupId, deleted: false },
        });

        const totalPages = Math.ceil(totalProjects / pageSize); // Calculate total pages

        // Fetch projects with their images and associated UserGallery with pagination
        const projects = await Projects.findAll({
            where: { projectGroupId: projectGroupId, deleted: false },
            attributes: ['id', 'projectGroupId', 'name', 'type', 'updatedAt'],
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
            limit: pageSize,  // Limit the number of projects returned per page
            offset: offset,   // Skip the previous pages based on offset
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

        // Prepare the final response with pagination metadata
        const response = {
            groupId: group.id,
            groupName: group.name,
            projects: transformedProjects,
            pagination: {
                totalItems: totalProjects,
                totalPages: totalPages,
                currentPage: page,
                pageSize: pageSize,
            }
        };

        return res
            .status(200)
            .json(formatResponse(response, "Projects fetched successfully.", true));

    } catch (error) {
        console.error("Error fetching projects by group:", error);
        return res
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
        await project.update({ 
            deleted: true,
            lastAction: "project_deleted"
        });

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

        // Check if project exists
        const project = await Projects.findOne({
            where: { 
                id: image.projectId,
                deleted: false
            }
        });

        if (!project) {
            return res.status(404).json(formatResponse(null, 'Project not found or has been deleted.', false));
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
        res.status(200).json(formatResponse(responseData, 'Project image saved successfully.', true));

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
            return res.status(400).json(formatResponse(null, 'Project ID is required', false));
        }

        // Find the project to ensure it exists
        const project = await Projects.findByPk(projectId);

        if (!project) {
            return res.status(404).json(formatResponse(null, 'Project not found', false));
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
                attributes: ['imageUrl', 'dimensionUnit'], // Fetch only the imageUrl field
            },
        });

        if (images.length === 0) {
            return res.status(200).json(formatResponse(null, 'No images found for this project', false));
        }

        // Prepare the response with project images and user gallery URLs
        const responseData = images.map((image) => {
            const { userGallery, ...imageData } = image.toJSON(); // Extract image data and associated user gallery
            return {
                ...imageData,
                imageUrl: userGallery ? userGallery.imageUrl : null, // If userGallery exists, include the imageUrl
                dimensionUnit: userGallery ? userGallery.dimensionUnit : null, // If userGallery exists, include the dimensionUnit
            };
        });

        // Return the images
        return res.status(200).json(formatResponse(responseData, 'Images fetched successfully', true));

    } catch (error) {
        console.error('Error fetching project images:', error);
        return res.status(500).json(formatResponse(null, 'Failed to fetch images', false));
    }
};

// save unity progress API
exports.saveUnityProgress = async (req, res) => {
    try {
        const { projectId, modelPlacements, status = "active" } = req.body;
        const userId = req.user.id;

        if (!projectId || !modelPlacements) {
            return res.status(200).json(formatResponse(null, 'Project ID and model placements are required.', false));
        }

        let newUnityProgress;

        if (Array.isArray(modelPlacements)) {
            // Handle multiple model placements
            newUnityProgress = await UnityProgress.bulkCreate(
                modelPlacements.map(placement => ({
                    projectId,
                    userId,
                    modelPlacements: placement,
                    status
                }))
            );

            // Transform the response to remove 'deleted' field from each entry
            const responseData = newUnityProgress.map(progress => {
                const { deleted, sessionData, deletedAt, ...data } = progress.toJSON();
                return data;
            });

            await updateProjectAction(projectId, "unity_changes");

            res.status(200).json(formatResponse(responseData, 'Multiple unity progress entries saved successfully.', true));
        } else {
            // Handle single model placement
            newUnityProgress = await UnityProgress.create({
                projectId,
                userId,
                modelPlacements,
                status
            });

            const { deleted, ...responseData } = newUnityProgress.toJSON();
            await updateProjectAction(projectId, "unity_changes");
            res.status(200).json(formatResponse(responseData, 'Unity progress saved successfully.', true));
        }
    } catch (error) {
        console.error('Error saving unity progress:', error);
        res.status(500).json(formatResponse(null, 'Failed to save unity progress', false));
    }
};

// get unity progress API
exports.getUnityProgress = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project details including the latest image
        const projectDetails = await Projects.findOne({
            where: {
                id: projectId,
                deleted: false
            },
            attributes: ['id', 'projectGroupId', 'name', 'type', 'updatedAt'],
            include: [
                {
                    model: ProjectImages,
                    as: 'images',
                    where: { deleted: false },
                    required: false,
                    attributes: ['id', 'imageId', 'dimensions', 'type'],
                    include: [
                        {
                            model: UserGallery,
                            as: 'userGallery',
                            attributes: ['imageUrl'],
                        }
                    ],
                    limit: 1,
                    order: [['updatedAt', 'DESC']] // Get the most recently updated image
                }
            ]
        });

        if (!projectDetails) {
            return res.status(404).json(formatResponse(null, 'Project not found.', false));
        }

        // Get unity progress data
        const unityProgress = await UnityProgress.findAll({
            attributes: ['id', 'projectId', 'userId', 'modelPlacements', 'status', 'createdAt'],
            where: {
                projectId,
                deleted: false
            },
            order: [['createdAt', 'DESC']]
        });

        // Transform project details to include the latest image URL
        const transformedProject = {
            ...projectDetails.toJSON(),
            image: projectDetails.images?.[0] ? {
                id: projectDetails.images[0].id,
                imageId: projectDetails.images[0].imageId,
                dimensions: projectDetails.images[0].dimensions,
                type: projectDetails.images[0].type,
                imageUrl: projectDetails.images[0].userGallery?.imageUrl || null
            } : null,
            images: undefined // Remove the images array since we're using a single image
        };

        // Prepare the final response
        const response = {
            projectDetails: transformedProject,
            sessionData: unityProgress
        };

        res.status(200).json(formatResponse(response, 'Unity progress and project details fetched successfully.', true));
    } catch (error) {
        console.error('Error fetching unity progress:', error);
        res.status(500).json(formatResponse(null, 'Failed to fetch unity progress', false));
    }
};

// get project image AI detection
exports.getProjectImageAIDetection = async (req, res) => {
    try {
        const { projectId, imageId } = req.query;
        console.log("Received request with projectId:", projectId, "imageId:", imageId);

        // Validate required parameters
        if (!projectId || !imageId) {
            return res.status(400).json(formatResponse(
                null,
                'Project ID and Image ID are required query parameters.',
                false
            ));
        }

        // First check if AI detection already exists
        // let projectImageAIDetection = await ProjectImageAIDetection.findOne({ 
        //     where: { 
        //         projectId: parseInt(projectId),
        //         imageId: parseInt(imageId),
        //         deleted: false  // Add this to ensure we don't get deleted records
        //     } 
        // });

        // console.log("Existing projectImageAIDetection:", projectImageAIDetection);

        // If AI detection exists, update lastAction and return it
        // if (projectImageAIDetection) {
        //     await updateProjectAction(parseInt(projectId), "ai_detection");
        //     return res.status(200).json(formatResponse(
        //         projectImageAIDetection, 
        //         'Project image AI detection fetched successfully.', 
        //         true
        //     ));
        // }

        // Verify that both project and project image exist
        const projectImage = await ProjectImages.findOne({
            where: { 
                id: parseInt(imageId),
                projectId: parseInt(projectId),
                deleted: false
            },
            include: [{
                model: UserGallery,
                as: 'userGallery',
                attributes: ['imageUrl', 'id']  // Also get the id for debugging
            }]
        });

        console.log("Found projectImage:", projectImage?.toJSON());

        if (!projectImage) {
            return res.status(404).json(formatResponse(
                null, 
                'Project image not found or does not belong to this project.', 
                false
            ));
        }

        if (!projectImage.userGallery?.imageUrl) {
            return res.status(404).json(formatResponse(
                null, 
                'Image URL not found in gallery.', 
                false
            ));
        }

        // Process the image using existing processImage function
        console.log("Attempting to process image with URL:", projectImage.userGallery.imageUrl);
        const processedImageResult = await processImage(projectImage.userGallery.imageUrl);
        console.log("processedImageResult:", processedImageResult);

        if (!processedImageResult || !processedImageResult.detections?.detections) {
            return res.status(500).json(formatResponse(
                null, 
                'Failed to process image for AI detection or invalid detection result.',
                false
            ));
        }

        return res.status(200).json(formatResponse(
            {
                data: processedImageResult.detections.detections
            }, 
            'Project image AI detection processed and saved successfully.', 
            true
        ));

        // try {
        //     // Save the detection results to database
        //     projectImageAIDetection = await ProjectImageAIDetection.create({
        //         projectId: parseInt(projectId),
        //         imageId: projectImage.id,  // Use the ProjectImage id, not the UserGallery id
        //         detections: processedImageResult.detections.detections,
        //         status: 'completed',
        //         deleted: false
        //     });

        //     console.log("Created new AI detection:", projectImageAIDetection.toJSON());

        //     // After saving new AI detection
        //     await updateProjectAction(parseInt(projectId), "ai_detection");

        //     // Return the newly created AI detection
        //     return res.status(200).json(formatResponse(
        //         projectImageAIDetection, 
        //         'Project image AI detection processed and saved successfully.', 
        //         true
        //     ));
        // } catch (createError) {
        //     console.error("Error creating AI detection:", createError);
        //     throw createError;  // Re-throw to be caught by outer catch block
        // }

    } catch (error) {
        console.error('Error in getProjectImageAIDetection:', error);
        return res.status(500).json(formatResponse(
            null, 
            `Failed to fetch or process project image AI detection: ${error.message}`,
            false
        ));
    }
};

// remove specific AI detection object
exports.removeProjectImageAIDetection = async (req, res) => {
    try {
        const { projectId, imageId } = req.query;
        const { detectedObject } = req.body;

        // Validate required parameters
        if (!projectId || !imageId || !detectedObject || !detectedObject.class_name) {
            return res.status(400).json(formatResponse(
                null,
                'Project ID, Image ID, and detected object with class_name are required.',
                false
            ));
        }

        // Find the existing AI detection record
        const aiDetection = await ProjectImageAIDetection.findOne({
            attributes: ['detections'],
            where: {
                projectId: parseInt(projectId),
                imageId: parseInt(imageId)
            }
        });

        if (!aiDetection) {
            return res.status(404).json(formatResponse(
                null,
                'AI detection record not found.',
                false
            ));
        }

        // Get current detections array
        const currentDetections = aiDetection.detections;

        // Filter out the objects that match the class_name and bbox
        const updatedDetections = currentDetections.filter(detection => {
            // If class_name is different, keep the detection
            if (detection.class_name !== detectedObject.class_name) {
                return true;
            }

            // If bbox is provided, compare bbox values
            if (detectedObject.bbox) {
                const currentBbox = detection.bbox;
                const targetBbox = detectedObject.bbox;
                
                // Keep the detection if bbox values don't match exactly
                return !(
                    currentBbox.xmax === targetBbox.xmax &&
                    currentBbox.xmin === targetBbox.xmin &&
                    currentBbox.ymax === targetBbox.ymax &&
                    currentBbox.ymin === targetBbox.ymin
                );
            }

            // If no bbox provided, remove all detections with matching class_name
            return false;
        });

        // Update the record with the filtered detections
        await aiDetection.update({
            detections: updatedDetections
        });

        // After updating the detections
        await updateProjectAction(parseInt(projectId), "ai_detection_removed");

        res.status(200).json(formatResponse({
            projectId,
            imageId,
            updatedDetections
        }, 'Object removed from AI detection successfully.', true));

    } catch (error) {
        console.error('Error removing object from AI detection:', error);
        res.status(500).json(formatResponse(
            null,
            'Failed to remove object from AI detection',
            false
        ));
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

// process image
const processImage = async (image) => {
    const url = process.env.AWS_IMAGE_BASE_URL + image; // Construct full image URL
    console.log("Processing image URL:", url);

    try {
        // Configure the request to the Flask server
        const flaskServerUrl = `http://${process.env.FLASK_HOST || 'localhost'}:${process.env.FLASK_PORT || 3001}/process-image`;
        console.log("Flask server URL:", flaskServerUrl);
        // Send the image URL to the Flask server
        const response = await axios.post(flaskServerUrl, {
            image_url: url
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            // Add timeout to prevent hanging
            timeout: 50000 // 50 seconds
        });

        if (response.data.status === 'success') {
            console.log('Image processing successful:', response);
            return response.data;
        } else {
            console.error('Image processing failed:', response.data.message);
            return false;
        }

    } catch (error) {
        console.error('Error processing image:', {
            message: error.message,
            url: url,
            response: error.response?.data,
            flaskServer: `http://${process.env.FLASK_HOST || 'localhost'}:${process.env.FLASK_PORT || 3000}/process-image`
        });
        return false;
    }
};

// Update Unity Progress
exports.updateUnityProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { modelPlacements } = req.body;

        if (!modelPlacements) {
            return res.status(400).json(formatResponse(null, 'Model placements data is required.', false));
        }

        // Find the unity progress entry
        const unityProgress = await UnityProgress.findOne({
            where: { 
                id,
                deleted: false 
            }
        });

        if (!unityProgress) {
            return res.status(404).json(formatResponse(null, 'Unity progress entry not found.', false));
        }

        // Update the model placements
        await unityProgress.update({ 
            modelPlacements,
            updatedAt: new Date()
        });

        await updateProjectAction(unityProgress.projectId, "unity_changes");

        // Get the updated record
        const updatedProgress = await UnityProgress.findByPk(id);
        const { deleted, sessionData, deletedAt, ...responseData } = updatedProgress.toJSON();

        res.status(200).json(formatResponse(responseData, 'Unity progress updated successfully.', true));
    } catch (error) {
        console.error('Error updating unity progress:', error);
        res.status(500).json(formatResponse(null, 'Failed to update unity progress', false));
    }
};

// Delete Unity Progress
exports.deleteUnityProgress = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the unity progress entry
        const unityProgress = await UnityProgress.findOne({
            where: { 
                id,
                deleted: false 
            }
        });

        if (!unityProgress) {
            return res.status(404).json(formatResponse(null, 'Unity progress entry not found.', false));
        }

        // Soft delete by setting deleted flag to true
        await unityProgress.destroy();

        res.status(200).json(formatResponse({ id }, 'Unity progress deleted successfully.', true));
    } catch (error) {
        console.error('Error deleting unity progress:', error);
        res.status(500).json(formatResponse(null, 'Failed to delete unity progress', false));
    }
};