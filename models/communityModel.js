// Connect to our database
const db = require('../services/database.js');
/*This could've been an option and to use it I'd need to just write db.query for each database interaction function*/

// Functions to work with communities in our database

/**
 * Get all communities from our database
 */
let getAllCommunities = () => new Promise((resolve, reject) => {
    db.config.query('SELECT * FROM communities', (err, communities, fields) => {
        if(err){
            reject(err); // If error, tell us what went wrong
        } else {
            console.log(communities); // Show communities in console for debugging
            resolve(communities); // Return the list of communities
        }
    })
})

/**
 * Get one specific community by its ID number
 */
let getCommunity = (id) => new Promise((resolve, reject) => {
    db.config.query('SELECT * FROM `communities` WHERE id = ?', [id], (err, community, fields) => {
        if(err){
            reject(err); // If error, tell us what went wrong
        } else {
            console.log(community); // Show community in console for debugging
            resolve(community); // Return the community
        }
    })
})

/**
 * Update a community's name and description
 */
let editCommunity = (communityData) => new Promise((resolve, reject) => {
    // Build SQL command to update the community
    let sql = "UPDATE communities SET " +
        "name = " + db.config.escape(communityData.name) +        // Escape special characters for safety
        ", description = " + db.config.escape(communityData.description) +
        " WHERE id = " + db.config.escape(parseInt(communityData.id));
    
    db.config.query(sql, function(err, result) {
        if (err) {
            reject(err); // If error, tell us what went wrong
        }
        resolve(communityData); // Return the updated community data
    });
});

/**
 * Delete a community and all its related data
 * Removes messages, challenges, and progress in the correct order
 */
let deleteCommunity = (id) => new Promise((resolve, reject) => {
    // 1. First, delete all chat messages for this community
    let deleteMessagesSql = "DELETE FROM messages WHERE community_id = ?";
    db.config.query(deleteMessagesSql, [id], function(err) {
        if (err) return reject(err);

        // 2. Find all challenges that belong to this community
        let getChallengesSql = "SELECT id FROM challenges WHERE community_id = ?";
        db.config.query(getChallengesSql, [id], function(err, challenges) {
            if (err) return reject(err);

            const challengeIds = challenges.map(c => c.id);
            if (challengeIds.length > 0) {
                // 3. Delete all user progress on these challenges
                let deleteProgressSql = "DELETE FROM user_challenge_progress WHERE challenge_id IN (?)";
                db.config.query(deleteProgressSql, [challengeIds], function(err) {
                    if (err) return reject(err);

                    // 4. Delete all challenges for this community
                    let deleteChallengesSql = "DELETE FROM challenges WHERE community_id = ?";
                    db.config.query(deleteChallengesSql, [id], function(err) {
                        if (err) return reject(err);

                        // 5. Finally, delete the community itself
                        let deleteCommunitySql = "DELETE FROM communities WHERE id = ?";
                        db.config.query(deleteCommunitySql, [id], function(err, result) {
                            if (err) return reject(err);
                            resolve(result);
                        });
                    });
                });
            } else {
                // No challenges, just delete the community
                let deleteCommunitySql = "DELETE FROM communities WHERE id = ?";
                db.config.query(deleteCommunitySql, [id], function(err, result) {
                    if (err) return reject(err);
                    resolve(result);
                });
            }
        });
    });
});

/**
 * Create a new community
 */
let createCommunity = (communityData) => new Promise((resolve, reject) => {
    // Build SQL command to add the new community
    let sql = "INSERT INTO communities (name, description) VALUES (" +
        db.config.escape(communityData.name) + ", " +      // Escape special characters for safety
        db.config.escape(communityData.description) +
        ")";
    
    db.config.query(sql, (err, result) => {
        if (err) return reject(err); // If error, tell us what went wrong
        resolve(result); // Return result (result.insertId will be the new community's ID)
    });
});

/**
 * Get all challenges that belong to a specific community
 */
let getChallengesByCommunity = (communityId) => new Promise((resolve, reject) => {
    db.config.query('SELECT * FROM challenges WHERE community_id = ?', [communityId], (err, challenges, fields) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(challenges); // Return the list of challenges
        }
    });
});

/**
 * Check if a user is already a member of a community
 */
let isUserInCommunity = (userId, communityId) => new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users_communities WHERE user_id = ? AND community_id = ?";
    db.config.query(sql, [userId, communityId], (err, result) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(result.length > 0); // Return true if user is already a member
        }
    });
});

/**
 * Add a user to a community
 */
let addUserToCommunity = (userId, communityId) => new Promise((resolve, reject) => {
    const sql = "INSERT INTO users_communities (user_id, community_id) VALUES (?, ?)";
    db.config.query(sql, [userId, communityId], (err, result) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(result); // Return the result
        }
    });
});

/**
 * Get all members of a specific community
 * Shows their name, email, and profile picture
 */
let getCommunityMembers = (communityId) => new Promise((resolve, reject) => {
    const sql = `
        SELECT u.id, u.name, u.surname, u.email, u.profile_pic 
        FROM users u 
        INNER JOIN users_communities uc ON u.id = uc.user_id 
        WHERE uc.community_id = ? AND u.deleted = 0
        ORDER BY u.name ASC
    `;
    db.config.query(sql, [communityId], (err, members) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(members); // Return the list of members
        }
    });
});

/**
 * Remove a user from a community
 */
let removeUserFromCommunity = (userId, communityId) => new Promise((resolve, reject) => {
    const sql = "DELETE FROM users_communities WHERE user_id = ? AND community_id = ?";
    db.config.query(sql, [userId, communityId], (err, result) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(result); // Return the result
        }
    });
});

/**
 * Get all communities that a specific user belongs to
 * Shows community name and description
 */
let getUserCommunities = (userId) => new Promise((resolve, reject) => {
    const sql = `
        SELECT c.id, c.name, c.description 
        FROM communities c 
        INNER JOIN users_communities uc ON c.id = uc.community_id 
        WHERE uc.user_id = ? AND c.id IS NOT NULL
        ORDER BY c.name ASC
    `;
    db.config.query(sql, [userId], (err, communities) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(communities); // Return the list of communities
        }
    });
});

// Share all these functions with other parts of our app
module.exports = {
    getAllCommunities,
    getCommunity,
    createCommunity,
    editCommunity,
    deleteCommunity,
    getChallengesByCommunity,
    isUserInCommunity,
    addUserToCommunity,
    getCommunityMembers,
    removeUserFromCommunity,
    getUserCommunities,
}