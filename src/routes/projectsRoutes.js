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

// Route for get project image AI detection
router.get('/getAIDetection', authenticateToken, projectsController.getProjectImageAIDetection);

// Route for removing specific AI detection object
router.put('/removeAIDetection', authenticateToken, projectsController.removeProjectImageAIDetection);

// Update Unity Progress
router.put('/unityProgress/:id', authenticateToken, projectsController.updateUnityProgress);

// Delete Unity Progress
router.delete('/unityProgress/:id', authenticateToken, projectsController.deleteUnityProgress);

// Route for marking AI detection as completed
router.put('/markAIDetectionCompleted', authenticateToken, projectsController.markAIDetectionCompleted);

module.exports = router;