const express = require('express');
const projectsController = require('../controllers/projectsController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/getGroups', authenticateToken, projectsController.getAllGroups);

// Route for create new project
router.post('/createProject', authenticateToken, projectsController.createProject);

// Route for get all projects by group
router.get('/getProjectsByGroup', authenticateToken, projectsController.getProjectsByGroup);

// Route for deleting a project
router.delete('/deleteProject/:id', authenticateToken, projectsController.deleteProject);

// Route for deleting a project group
router.delete('/deleteProjectGroup/:id', authenticateToken, projectsController.deleteProjectGroup);

// Route for save project images
router.post('/saveProjectImages', authenticateToken, projectsController.saveProjectImage);

// Route for get project images
router.get('/getProjectImages/:projectId', authenticateToken, projectsController.getImagesForProject);

// Route for save unity progress
router.post('/saveUnityProgress', authenticateToken, projectsController.saveUnityProgress);

// Route for get unity progress
router.get('/getUnityProgress/:projectId', authenticateToken, projectsController.getUnityProgress);

module.exports = router;
