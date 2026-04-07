// Routes for community-related pages (communities, challenges, chat)

const express = require('express');
const authenticationService = require("../services/authentication"); // Functions to handle login/security
const communityController = require("../controllers/communityController"); // Functions to handle community actions
const isAdmin = require('../services/isAdmin'); // Check if user is admin
const router = express.Router();

// Dummy data for demonstration
/*const communities = [
    { id: 1, name: 'Web Developers', description: 'A place for web devs.' },
    { id: 2, name: 'Gamers', description: 'Gaming community' },
];*/

// Make sure user is logged in for all these pages
router.use(authenticationService.authenticateJWT);

// Show a list of all communities
router.get('/', communityController.getAllCommunities);

// Show a form to create a new community
router.get('/add', (req, res) => {
    res.render('addCommunityWithChallenges');
});

// Join a community
router.post('/:id/join', communityController.joinCommunity);

// Leave a community
router.post('/:id/leave', communityController.leaveCommunity);

// Create a new community with challenges
router.post('/add-with-challenges', communityController.createCommunityWithChallenges);

// Show a specific community's page (must come last to avoid conflicts)
router.get('/:id', communityController.getCommunity);

// Show a form to edit a community (admin only)
router.get('/:id/edit', isAdmin, communityController.editCommunity);

// Save changes to a community (admin only)
router.post('/:id/edit', isAdmin, communityController.updateCommunity);

// Delete a community (admin only)
router.delete('/:id', isAdmin, communityController.deleteCommunity);

// Save a user's progress on challenges for today
router.post('/:id/progress', communityController.saveProgress);

// Share these routes with our main app
module.exports = router;

