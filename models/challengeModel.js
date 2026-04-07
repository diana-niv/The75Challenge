// Connect to our database
const db = require('../services/database');

// Functions to work with challenges (checklists) in our database

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
 * Check if a user completed a specific challenge on a specific date
 * Returns 1 if completed, 0 if not completed
 */
let getUserProgress = (userId, challengeId, date) => new Promise((resolve, reject) => {
    db.config.query(
        'SELECT completed FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ? AND date = ?',
        [userId, challengeId, date],
        (err, result, fields) => {
            if (err) {
                reject(err); // If error, tell us what went wrong
            } else {
                // If no record found, return 0 (not completed), otherwise return the completion status
                resolve(result.length > 0 ? result[0].completed : 0);
            }
        }
    );
});

/**
 * Save or update a user's progress on a challenge for a specific date
 * If they already have progress for that date, it updates it
 * If not, it creates a new record
 */
let setUserProgress = (userId, challengeId, date, completed) => new Promise((resolve, reject) => {
    const sql = `
        INSERT INTO user_challenge_progress (user_id, challenge_id, date, completed)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE completed = VALUES(completed)
    `;
    db.config.query(sql, [userId, challengeId, date, completed], (err, result) => {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            resolve(result); // Return the result
        }
    });
});

/**
 * Create a new challenge for a community
 */
let createChallenge = (challengeData) => new Promise((resolve, reject) => {
  let sql = "INSERT INTO challenges (community_id, name, description) VALUES (?, ?, ?)";
  db.config.query(sql, [challengeData.community_id, challengeData.name, challengeData.description], (err, result) => {
      if (err) return reject(err); // If error, tell us what went wrong
      resolve(result); // Return the result
  });
});

/**
 * Get all dates where a user has any challenge progress
 * Used to show which days they've been active
 */
let getUserDates = (userId) => new Promise((resolve, reject) => {
    db.config.query(
        'SELECT DISTINCT date FROM user_challenge_progress WHERE user_id = ? ORDER BY date',
        [userId],
        (err, results) => {
            if (err) reject(err); // If error, tell us what went wrong
            else resolve(results.map(r => r.date)); // Return just the dates
        }
    );
});

/**
 * Get a user's total progress for a specific day
 * Shows how many challenges they completed vs total available
 */
let getDayProgress = (userId, date) => new Promise((resolve, reject) => {
    db.config.query(
        'SELECT COUNT(*) as total, SUM(completed) as completed FROM user_challenge_progress WHERE user_id = ? AND date = ?',
        [userId, date],
        (err, results) => {
            if (err) reject(err); // If error, tell us what went wrong
            else resolve({
                total: results[0].total,           // Total challenges for that day
                completed: results[0].completed || 0 // How many they completed
            });
        }
    );
});

// Share all these functions with other parts of our app
module.exports = {
    getChallengesByCommunity,
    getUserProgress,
    setUserProgress,
    createChallenge,
    getUserDates,   
    getDayProgress 
};