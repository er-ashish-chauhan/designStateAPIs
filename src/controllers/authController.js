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

exports.createUser = async (req, res) => {
    try {
        const { firstname, lastname, email, password, age } = req.body;

        // Validate required fields
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).json(formatResponse(null, "All fields are required.", false));
        }

        // Hash the password before storing it
        const saltRounds = 10; // Adjust this value as needed for security/performance balance
        const hashedPassword = await bcrypt.hash(String(password), saltRounds);

        // Create a new user with the hashed password
        const newUser = await User.create({ firstname, lastname, age, email, password: hashedPassword });

        // Exclude the password in the response
        const userResponse = { id: newUser.id, firstname: newUser.firstname, lastname: newUser.lastname, email: newUser.email, age: newUser.age };

        // const user = await User.create(req.body);
        res.status(201).json(formatResponse(userResponse, "User registered successfully."));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.checkUserExist = async (req, res) => {
    try {
        const { email } = req.query;

        // Validate input
        if (!email) {
            return res.status(400).json(formatResponse(null, 'Email is required', false));
        }

        // Search for user in the database
        const user = await User.findOne({ where: { email } });

        if (user) {
            const {
                id,
                firstname,
                lastname,
                email,
                age
            } = user;
            // User exists
            return res.status(200).json(formatResponse({
                id,
                firstname,
                lastname,
                email,
                age
            }, 'User exists', true));
        }

        // User does not exist
        return res.status(200).json(formatResponse(null, 'User does not exist', false));
    } catch (error) {
        console.error('Error in checkUserExist:', error);
        return res.status(500).json(formatResponse(null, 'Internal server error', false));
    }
};