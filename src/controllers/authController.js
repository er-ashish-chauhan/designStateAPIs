// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { formatResponse } = require('../utils/formatResponse');

// Secret key for JWT (use a secure environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET;

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json(formatResponse(null, "Email and password are required", false));
        }

        // Find the user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json(formatResponse(null, 'Invalid email or password', false));
        }

        // Compare provided password with stored hashed password
        const isPasswordValid = await bcrypt.compare(String(password), user.password);
        if (!isPasswordValid) {
            return res.status(401).json(formatResponse(null, 'Invalid email or password', false));
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '1h', // Token validity duration
        });

        res.status(200).json(formatResponse(token, "user logged-in successfully."));
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
};
