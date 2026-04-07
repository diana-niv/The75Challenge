// Import all the tools we need to build our website
const express = require('express');           // Main web framework
const fs = require('fs');                     // For reading/writing files
const app = express();                        // Create our web app
const port = 3000;                           // Port number for our server
const http = require('http');                 // HTTP server
const server = http.createServer(app);        // Create server with our app
const db = require('./services/database.js'); // Database connection
const setupSocket = require('./services/websockets.js'); // Real-time chat
const authenticationService = require('./services/authentication'); // Login system
const { profileUpload, handleUploadError } = require('./services/upload'); // File uploads
const bodyParser = require('body-parser');    // Read form data
const cookieParser = require('cookie-parser'); // Read cookies
const methodOverride = require('method-override'); // Handle DELETE/PUT requests
const path = require('path');                 // Work with file paths
const cors = require("cors")


// Set up all the tools our app needs to work
app.use(methodOverride('_method'));          // Allow DELETE/PUT in forms
app.use(cookieParser());                     // Read cookies from browser
app.use(bodyParser.json());                  // Read JSON data
app.use(bodyParser.urlencoded({ extended: true })); // Read form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve CSS/JS files

app.use(cors({
    credentials: true
}))

// Tell our app to use EJS for making web pages
app.set('views', path.join(__dirname, 'views')); // Where to find our page templates
app.set('view engine', 'ejs');               // Use EJS to make pages

// Check if user is logged in on every request
app.use((req, res, next) => {
    const token = req.cookies["accessToken"]; // Get login token from browser
    if (token) {
        const jwt = require('jsonwebtoken');   // Tool to check if token is valid
        const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET; // Secret key
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
            if (!err) {
                req.user = user;               // Save user info for this request
            }
            next();                           // Continue to next step
        });
    } else {
        next();                              // No token, continue anyway
    }
});

// Make the logged-in user available in all our web pages
app.use((req, res, next) => {
    res.locals.currentUser = req.user;       // Share user info with all pages
    next();
});

// Import our different page sections (routes)
const indexRouter = require('./routes/index');        // Homepage
const usersRouter = require('./routes/users');        // User pages
const communitiesRouter = require('./routes/communities'); // Community pages

// Tell our app which URLs go to which sections
app.use('/', indexRouter);                   // Homepage at /
app.use('/users', usersRouter);              // User pages at /users
app.use('/communities', communitiesRouter);  // Community pages at /communities

// Allow users to see uploaded profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle errors if something goes wrong
app.use(handleUploadError);                  // Handle file upload errors

app.use((req, res, next) => {
    const error = new Error(`Page not found: ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', { error: err });
});

// Start the real-time chat system
setupSocket(server);

// Start our web server
server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});