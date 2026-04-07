// Routes for user-related pages (user profiles, editing, badges)

// Import tools we need
const express = require('express');
const router = express.Router(); // Create a new Express router instance
const userController = require('../controllers/userController.js'); // Functions to handle user actions
const badgesController = require('../controllers/badgesController.js'); // Functions to handle badges
const authenticationService = require('../services/authentication'); // Functions to handle login/security
const {profileUpload} = require("../services/upload"); // Handle profile picture uploads

// Make sure user is logged in for all these pages
// This ensures all requests to the following routes require a valid login token
const indexRouter = require('./index');

// Apply JWT authentication middleware to all routes in this router
// This ensures all requests to the following routes require a valid JWT token
router.use(authenticationService.authenticateJWT);

// Route: GET /
// Description: Retrieves a list of all users
router.get('/', (req, res, next) => {
    // Add logged-in users count to the request
    req.loggedInCount = indexRouter.getLoggedInUsersCount();
    userController.getUsers(req, res, next);
});

// Add a new user (admin only)
router.post('/add', userController.addUser);

// Badge-related pages
router.get('/badges', badgesController.getAllBadges); // Show all available badges
router.get('/:id/badges', authenticationService.authorizeSelfOrAdmin, badgesController.getUserBadges); // Show user's badges

// Show a specific user's profile page
// Users can only see their own profile, admins can see all profiles
router.get('/:id', authenticationService.authorizeSelfOrAdmin, userController.getUser);

// Show a form to edit a user's profile
// Users can only edit their own profile, admins can edit any profile
router.get('/:id/edit', authenticationService.authorizeSelfOrAdmin, userController.editUser);

// Save changes to a user's profile
// Also handles profile picture upload if they included one
router.post('/:id', profileUpload.single('profile_pic'), (req, res, next) => {
    // Update the user's information
    userController.updateUser(req, res, next);
});

// Delete a user account
// Users can only delete their own account, admins can delete any account
router.delete('/:id', authenticationService.authorizeSelfOrAdmin, userController.deleteUser);

// Share these routes with our main app
module.exports = router;