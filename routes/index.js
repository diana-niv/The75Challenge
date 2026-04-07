// Routes for the main pages of our website (homepage, login, register, chat)

const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");     // Functions to handle user actions
const authenticationService = require('../services/authentication'); // Functions to handle login
const userModel = require('../models/userModel');                    // Functions to work with users in database
const { profileUpload, handleUploadError } = require('../services/upload'); // Handle file uploads

const loggedInUsers = new Set();
// Show the homepage
router.get('/', (req, res) => {
    res.render('index', {title: 'Express'});
});

// Show the registration form page
router.get('/register', (req, res) => {
    res.render('register');
});

// Handle when someone submits the registration form
// Also handles profile picture upload if they included one
router.post('/register', profileUpload.single('profile_pic'), (req, res, next) => {
    // If they uploaded a profile picture, save the filename
    if (req.file) {
        req.body.profile_pic = req.file.filename;
    }

    // Create the new user account
    userController.registerUser(req, res, next);
});

// Show the global chat page
router.get('/chat', (req, res) => {
    res.render('chat');
});

/**
 * Handle login:
 * - GET: Show the login form page
 * - POST: Check their username and password, log them in if correct
 */
router.route('/login')
    .get((req, res, next) => {
        res.render('login'); // Show login form
    })
    .post(async (req, res, next) => {
        try {
            const users = await userModel.getUsers();
            const result = await authenticationService.authenticateUser(req.body, users);

            if (!result.success) {
                // Render login page with error message
                return res.render('login', { error: result.error });
            }

            // Add user to logged-in users set
            loggedInUsers.add(result.user.id);

            // Set cookie and redirect if successful
            res.cookie("accessToken", result.accessToken);
            res.redirect("/users/" + result.user.id);
        } catch (err) {
            res.render('login', { error: "Internal server error." });
        }
    });
/**
 * Handle logout:
 * - Remove their login token and go back to homepage
 */
router.get('/logout', (req, res) => {
    res.cookie('accessToken', '', {maxAge: 0}); // Delete their login cookie
    res.redirect('/'); // Go to homepage
    // Remove user from logged-in users set
    // You'll need to get the user ID from the token first
    const token = req.cookies.accessToken;
    if (token) {
        try {
            // Decode the token to get user ID (you'll need to implement this)
            const decoded = authenticationService.verifyToken(token);
            if (decoded && decoded.user && decoded.user.id) {
                loggedInUsers.delete(decoded.user.id);
            }
        } catch (err) {
            // Token might be invalid, but we still want to log out
            console.log('Error removing user from logged-in set:', err);
        }
    }

    res.cookie('accessToken', '', {maxAge: 0});
    res.redirect('/');
});

// Handle any file upload errors
router.use(handleUploadError);

// Share these routes with our main app
// Helper function to get logged-in users count
function getLoggedInUsersCount() {
    return loggedInUsers.size;
}

// Export the function
router.getLoggedInUsersCount = getLoggedInUsersCount;

module.exports = router;