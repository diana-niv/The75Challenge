const db = require('../services/database');
const {query} = require("express");

let getAllBadges = () => new Promise((resolve, reject) => {
    db.config.query('SELECT * FROM badges', (err, badges, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(badges);
        }
    });
});

let getUserBadges = (userId) => new Promise((resolve, reject) => {
    const sql = `
        SELECT badges.*, users_badges.user_id
        FROM badges
                 JOIN users_badges ON badges.id = users_badges.badge_id
        WHERE users_badges.user_id = ?
        ORDER BY badges.id
    `;
    db.config.query(sql, [userId], (err, badges, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(badges);
        }
    });
});

let userHasBadge = (userId, badgeId) => new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users_badges WHERE user_id = ? AND badge_id = ?';
    db.config.query(sql, [userId, badgeId], (err, result, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(result.length > 0);
        }
    });
});

let awardBadge = (userId, badgeId) => new Promise((resolve, reject) => {
    const sql = 'INSERT INTO users_badges (user_id, badge_id) VALUES (?, ?)';
    db.config.query(sql, [userId, badgeId], (err, result) => {
        if (err) {
            reject(err);
        } else {
            resolve(result);
        }
    });
});

let getUserChallengeStats = (userId) => new Promise((resolve, reject) => {
    const sql = `
        SELECT
            COUNT(DISTINCT date) as total_days,
            COUNT(DISTINCT CASE WHEN daily_completion.completed_challenges = daily_completion.total_challenges
                                    THEN date END) as completed_days,
            COUNT(DISTINCT CASE WHEN daily_completion.completed_challenges < daily_completion.total_challenges
                                    THEN date END) as failed_days,
            MIN(date) as start_date,
            MAX(date) as last_activity
        FROM (
                 SELECT
                     date,
                     user_id,
                     SUM(completed) as completed_challenges,
                     COUNT(*) as total_challenges
                 FROM user_challenge_progress
                 WHERE user_id = ?
                 GROUP BY date, user_id
             ) daily_completion;
    `;
    db.config.query(sql, [userId], (err, result, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(result[0] || {});
        }
    });
});

let getUserStreak = (userId) => new Promise((resolve, reject) => {
    const sql = `
        SELECT
            COUNT(*) as current_streak
        FROM (
                 SELECT date, completed,
                     ROW_NUMBER() OVER (ORDER BY date DESC) as rn,
                     ROW_NUMBER() OVER (PARTITION BY completed ORDER BY date DESC) as completed_rn
                 FROM user_challenge_progress
                 WHERE user_id = ?
                 ORDER BY date DESC
             ) t
        WHERE completed = 1 AND rn = completed_rn
    `;
    db.config.query(sql, [userId], (err, result, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(result[0]?.current_streak || 0);
        }
    });
});

let userHasFailures = (userId) => new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user_challenge_progress WHERE user_id = ? AND completed = 0 LIMIT 1';
    db.config.query(sql, [userId], (err, result, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(result.length > 0);
        }
    });
});

module.exports = {
    getAllBadges,
    getUserBadges,
    userHasBadge,
    awardBadge,
    getUserChallengeStats,
    getUserStreak,
    userHasFailures
};