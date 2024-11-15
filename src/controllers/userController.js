const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, age } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password || !age) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password before storing it
    const saltRounds = 10; // Adjust this value as needed for security/performance balance
    const hashedPassword = await bcrypt.hash(String(password), saltRounds);

    // Create a new user with the hashed password
    const newUser = await User.create({ firstname, lastname, age, email, password: hashedPassword });

    // Exclude the password in the response
    const userResponse = { id: newUser.id, firstname: newUser.firstname, lastname: newUser.lastname, email: newUser.email, age: newUser.age };

    // const user = await User.create(req.body);
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from token

    // Fetch user details (excluding sensitive info like password)
    const user = await User.findOne({ where: { id: userId }, attributes: ['id', 'firstname', 'lastname', 'email'] });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'An error occurred while fetching user details' });
  }
};