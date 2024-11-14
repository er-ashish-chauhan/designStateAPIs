require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes'); // Import the routes
const sequelize = require('./config/db');
const morgan = require('morgan');
const winston = require('winston');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Enable CORS for all routes
app.use(cors());

// Middleware for logging HTTP requests
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware
app.use(bodyParser.json());

// Example route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Routes
app.use('/api/v1/', routes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down server...');
    process.exit(0);
});

sequelize.sync({ alter: true })
    .then(() => console.log('Database & tables created!'))
    .catch((err) => console.error('Error syncing database:', err));
