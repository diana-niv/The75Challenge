const userModel = require("../models/userModel");
const badgeService = require('../services/badgeService');
const communityModel = require('../models/communityModel');
const isAdmin = require("../services/isAdmin");
const fs = require('fs');
const path = require('path');
const {profileUpload, deleteOldProfilePic} = require("../services/upload"); // Import auth service

// Functions that handle user-related web requests

/**
 * Show a list of all users on the website
 * Gets all users from database and shows them on a page
 */
function getUsers(req, res, next) {
    userModel.getUsers()
        .then(users => {
            res.render('users', {
                users,
                currentUser: req.user, // or however you get current user
                loggedInCount: req.loggedInCount || 0 // This comes from the router modification
            });
        })
        .catch(err => {
            next(err) // If something goes wrong, show an error page
        });
}

/**
 * Show one specific user's profile page
 * Gets user info, their badges, and communities they belong to
 */
function getUser(req, res, next) {
    const userId = parseInt(req.params.id); // Get the user ID from the website address

    // Make sure the user ID is a valid number
    if (!userId || isNaN(userId)) {
        return res.status(400).render('error', {
            error: { message: 'Invalid user ID provided' }
        });
    }

    // Get user data, their badges, and communities all at the same time
    Promise.all([
        userModel.getUser(userId),                    // Get basic user info
        badgeService.getUserBadgeProgress(userId),    // Get their badges
        communityModel.getUserCommunities(userId)     // Get communities they're in
    ])
        .then(([users, badgeData, userCommunities]) => {
            const user = users[0]; // Get the first (and only) user from the list
            if (!user) {
                return next(new Error("No user found with id " + userId));
            }
            // Show the user's profile page with all their information
            res.render('user', {
                user: user,
                userBadges: badgeData.userBadges,
                badgeProgress: badgeData.badgeProgress,
                stats: badgeData.stats,
                userCommunities: userCommunities
            });
        })
        .catch(err => {
            next(err); // If something goes wrong, show an error page
        });
}

/**
 * Add a new user to the database
 * Usually used by admins to create user accounts
 */
function addUser(req, res, next){
    userModel.addUser(req.body) // Add the user with the information from the form
        .then(user => res.redirect('/users')) // Go back to the users list page
        .catch(err => {
            next(err) // If something goes wrong, show an error page
        });
}

/**
 * Show a form to edit a user's information
 * Gets the user's current info and shows it in a form
 */
function editUser(req, res, next) {
    userModel.getUser(req.params.id) // Get the user's current information
        .then(user => res.render('editUser', { user: user[0] })) // Show the edit form
        .catch(err => {
            next(err) // If something goes wrong, show an error page
        });
}

/**
 * Update a user's information in the database
 * Saves the changes from the edit form
 */
function updateUser(req, res, next) {
    console.log("User Con", req.file);
    console.log("User Con param", req.params.id);
    console.log("User Con body", req.body);

    userModel.getUser(req.params.id)
        .then(users => {
            const user = users[0];
            if (!user) {
                return res.status(404).send('User not found');
            }

            const wantsToRemove = req.body.remove_photo === 'true';
            const hadOldPic = Boolean(user.profile_pic);

            if (req.file) {
                if (hadOldPic) deleteOldProfilePic(user.profile_pic);
                req.body.profile_pic = req.file.filename;
            } else if (wantsToRemove && hadOldPic) {
                deleteOldProfilePic(user.profile_pic);
                req.body.profile_pic = null;
            } else {
                req.body.profile_pic = user.profile_pic;
            }

            return userModel.updateUser(req.body);
        })
        .then(updatedUser => {
            if (updatedUser) {
                res.redirect(`/users/${req.params.id}`);
            }
        })
        .catch(err => {
            next(err);
        });
}

/**
 * Delete a user from the database
 * Can either completely remove them or just mark them as deleted
 */

function deleteUser(req, res, next) {
    const deleteType = "softDelete"; // Just mark as deleted, don't completely remove
    const userId = req.params.id; // Get the user ID from the website address
    
    userModel.deleteUser(userId, deleteType)
        .then(() => {
            // If the user is deleting their own account, log them out
            if (req.user.id == userId) {
                res.clearCookie('accessToken'); // Remove their login cookie
                res.redirect('/'); // Go to homepage
            } else {
                res.redirect('/users'); // Stay on users page if deleting someone else
            }
        })
        .catch(err => {
            console.error('Delete user errors:', err);
            next(err); // If something goes wrong, show an error page
        });
}

/**
 * Register a new user account
 * Used when someone signs up for the website
 */
function registerUser(req, res, next) {
    userModel.createUser(req.body) // Create the new user account
        .then(user => res.redirect('/login')) // Go to the login page
        .catch(err => {
            console.error('Error in registerUser:', err);
            next(err); // If something goes wrong, show an error page
        });
}

// Share all these functions with other parts of our app
module.exports = {
    getUsers,
    getUser,
    updateUser,
    editUser,
    registerUser,
    addUser,
    deleteUser
}