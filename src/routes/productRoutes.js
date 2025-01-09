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

router.delete('/wishlistItems/:productId', authenticateToken, productController.removeFromWishlist);

router.put('/updateProduct/:productId', authenticateToken, productController.updateProduct);

module.exports = router;
