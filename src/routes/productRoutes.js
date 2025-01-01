const express = require('express');
const productController = require('../controllers/productController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get all products
// router.get('/', userController.getAllUsers);

router.get('/categories', authenticateToken, productController.getCategories);

router.post('/insertProducts', authenticateToken, productController.insertProducts);

router.get('/', authenticateToken, productController.getProducts);

router.post('/addWishlist', authenticateToken, productController.wishlistProduct);

router.get('/wishlistItems', authenticateToken, productController.getWishlistItems);

module.exports = router;
