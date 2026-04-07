// Import tools we need
const communityModel = require('../models/communityModel'); // Functions to work with communities
const challengeModel = require('../models/challengeModel'); // Functions to work with challenges
const db = require('../services/database.js');             // Connect to database

// Functions that handle community-related web requests

/**
 * Show a list of all communities on the website
 */
function getAllCommunities (req, res, next) {
    communityModel.getAllCommunities() // Get all communities from database
        .then(communities => res.render('communities', { communities })) // Show the communities page
        .catch(err => res.sendStatus(500)) // If something goes wrong, show error
}

/**
 * Show one specific community's page
 * Gets community info, challenges, chat messages, and user's progress
 */
function getCommunity(req, res, next) {
    const id = parseInt(req.params.id); // Get community ID from website address
    const userId = req.user.id;         // Get the logged-in user's ID
    const today = new Date().toISOString().slice(0, 10); // Get today's date

    communityModel.getCommunity(id) // Get the community information
        .then(communities => {
            if (!communities || communities.length === 0) {
                return res.status(404).render('error', { error: 'Community not found' });
            }

            const community = communities[0];

            // Get all the information we need for this community page
            return Promise.all([
                challengeModel.getChallengesByCommunity(id), // Get all challenges
                new Promise((resolve, reject) => {
                    // Get recent chat messages for this community
                    db.config.query(
                        'SELECT username, message, created_at FROM messages WHERE community_id = ? ORDER BY created_at ASC LIMIT 50',
                        [community.id],
                        (err, messages) => {
                            if (err) {
                                console.error('Error fetching messages:', err);
                                resolve([]); // If error, just use empty list
                            } else {
                                resolve(messages);
                            }
                        }
                    );
                }),
                communityModel.isUserInCommunity(userId, id), // Check if user is a member
                communityModel.getCommunityMembers(id)        // Get list of all members
            ]).then(([challenges, messages, isMember, members]) => {
                // Get the user's progress on all challenges for today
                const progressPromises = challenges.map(challenge =>
                    challengeModel.getUserProgress(userId, challenge.id, today)
                        .then(result => [challenge.id, result])
                );
                return Promise.all(progressPromises).then(progressArr => {
                    const progress = {};
                    progressArr.forEach(([challengeId, result]) => {
                        progress[challengeId] = result;
                    });
                    // Show the community page with all the information
                    res.render('community', {
                        community,
                        challenges,
                        progress,
                        today,
                        chatRoom: `room-${community.id}`,
                        username: req.user.name,
                        userId: req.user.id,
                        messages,
                        isMember,
                        members
                    });
                });
            });
        })
        .catch(err => {
            console.error('getCommunity error:', err);
            res.status(500).render('error', { error: 'Internal server error' });
        });
}

/**
 * Check if the current user is an admin
 * Only user with ID 14 is considered admin
 */
function isAdmin(req) {
    return req.user && req.user.id == 14;
}

/**
 * Show a form to edit a community (admin only)
 */
function editCommunity(req, res, next) {
    if (!isAdmin(req)) {
        return res.status(403).render('error', { error: 'Forbidden: Admins only.' });
    }
    communityModel.getCommunity(req.params.id) // Get current community info
        .then(community => res.render('editCommunity', { community: community[0] })) // Show edit form
        .catch(err => res.sendStatus(500));
}

/**
 * Save changes to a community (admin only)
 */
function updateCommunity(req, res, next) {
    if (!isAdmin(req)) {
        return res.status(403).render('error', { error: 'Forbidden: Admins only.' });
    }
    const { name, description } = req.body; // Get new name and description from form
    const id = req.params.id;
    communityModel.editCommunity({ id, name, description }) // Update the community
        .then(() => res.redirect(`/communities/${id}`)) // Go back to community page
        .catch(err => res.sendStatus(500));
}

/**
 * Delete a community and all its data (admin only)
 */
function deleteCommunity(req, res, next) {
    if (!isAdmin(req)) {
        return res.status(403).render('error', { error: 'Forbidden: Admins only.' });
    }
    const id = req.params.id;
    communityModel.deleteCommunity(id) // Delete the community
        .then(() => res.redirect('/communities')) // Go back to communities list
        .catch(err => {
            console.error('Delete community error:', err);
            res.status(500).render('error', { error: 'Internal server error' });
        });
}

/**
 * Save a user's progress on challenges for today
 * Updates which challenges they completed
 */
function saveProgress(req, res, next) {
    const communityId = parseInt(req.params.id);
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10); // Get today's date

    communityModel.getChallengesByCommunity(communityId) // Get all challenges for this community
        .then(challenges => {
            // Update progress for each challenge
            const updatePromises = challenges.map(challenge => {
                const checked = req.body[`challenge_${challenge.id}`] ? 1 : 0; // 1 if checked, 0 if not
                return challengeModel.setUserProgress(userId, challenge.id, today, checked);
            });
            return Promise.all(updatePromises); // Wait for all updates to finish
        })
        .then(() => res.redirect(`/communities/${communityId}`)) // Go back to community page
        .catch(err => next(err));
}

/**
 * Create a new community with challenges
 * Used when someone wants to start a new fitness community
 */
function createCommunityWithChallenges(req, res, next) {
    const { name, description, challenge_names, challenge_descriptions } = req.body;
    communityModel.createCommunity({ name, description }) // Create the community first
        .then(result => {
            console.log('Create community result:', result);
            const communityId = result.insertId; // Get the new community's ID
            
            // Prepare the list of challenges to create
            const challenges = [];
            if (Array.isArray(challenge_names)) {
                // Multiple challenges
                for (let i = 0; i < challenge_names.length; i++) {
                    if (challenge_names[i]) {
                        challenges.push({
                            community_id: communityId,
                            name: challenge_names[i],
                            description: challenge_descriptions[i] || ''
                        });
                    }
                }
            } else if (challenge_names) { // Only one challenge
                challenges.push({
                    community_id: communityId,
                    name: challenge_names,
                    description: challenge_descriptions || ''
                });
            }
            
            // Create all the challenges
            if (challenges.length > 0) {
                Promise.all(challenges.map(challengeModel.createChallenge))
                    .then(() => res.redirect(`/communities/${communityId}`)) // Go to new community
                    .catch(err => next(err));
            } else {
                res.redirect(`/communities/${communityId}`);
            }
        })
        .catch(err => next(err));
}

/**
 * Add a user to a community
 * Used when someone wants to join a community
 */
function joinCommunity(req, res, next) {
    const userId = req.user.id;
    const communityId = parseInt(req.params.id);

    communityModel.isUserInCommunity(userId, communityId) // Check if already a member
        .then(isMember => {
            if (isMember) {
                // User is already a member — just go to community page
                return res.redirect(`/communities/${communityId}`);
            } else {
                // Add the user to the community
                return communityModel.addUserToCommunity(userId, communityId)
                    .then(() => {
                        res.redirect(`/communities/${communityId}`);
                    });
            }
        })
        .catch(err => {
            console.error("Error joining community:", err);
            res.status(500).render('error', { error: 'Internal server error' });
        });
}

/**
 * Remove a user from a community
 * Used when someone wants to leave a community
 */
function leaveCommunity(req, res, next) {
    const userId = req.user.id;
    const communityId = parseInt(req.params.id);

    communityModel.removeUserFromCommunity(userId, communityId) // Remove from community
        .then(() => {
            res.redirect(`/communities/${communityId}`); // Go back to community page
        })
        .catch(err => {
            console.error("Error leaving community:", err);
            res.status(500).render('error', { error: 'Internal server error' });
        });
}

// Share all these functions with other parts of our app
module.exports = {
    getAllCommunities,
    getCommunity,
    editCommunity,
    updateCommunity,
    deleteCommunity,
    saveProgress,
    createCommunityWithChallenges,
    joinCommunity,
    leaveCommunity,
}

