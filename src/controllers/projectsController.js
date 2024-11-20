const { Projects, ProjectGroups } = require('../models/associations');

const { formatResponse } = require('../utils/formatResponse');

exports.getAllGroups = async (req, res) => {
    try {
        const userId = req.user.id; // Retrieve userId from token (req.user set by auth middleware)

        const groups = await ProjectGroups.findAll({
            where: { userId: userId, deleted: false }, // Add condition for deleted flag
        });
        if (groups.length === 0) {
            return res.status(404).json(formatResponse(null, "No project groups exist.", false));
        }
        res.status(200).json(formatResponse(groups, "Project groups fetched successfully.", true));
    } catch (error) {
        res.status(500).json(formatResponse(null, error.message, false)); // Use formatResponse for error
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
            const newGroup = await ProjectGroups.create({ name: groupName, userId: userId });
            finalGroupId = newGroup.id;
        }

        // Create a new project with the finalGroupId
        const newProject = await Projects.create({
            projectGroupId: finalGroupId,
            projectGroupName: finalGroupId,
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

        // Fetch the projects associated with the group
        const projects = await Projects.findAll({
            where: { projectGroupId: projectGroupId, deleted: false },
        });

        // Prepare response with group name
        const response = {
            groupName: group.name,
            projects: projects,
        };

        res
            .status(200)
            .json(formatResponse(response, "Projects fetched successfully.", true));
    } catch (error) {
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
