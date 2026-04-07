const badgeModel = require('../models/badgesModel');
const badgeService = require('../services/badgeService');

// Show all badges
function getAllBadges(req, res, next) {
    badgeModel.getAllBadges()
        .then(badges => res.json({ badges }))
        .catch(err => {
            console.error('getAllBadges error:', err);
            res.sendStatus(500);
        });
}

// Show user's badges
function getUserBadges(req, res, next) {
    const userId = req.params.id ? parseInt(req.params.id) : req.user.id;

    // Get badge progress (which also checks and awards new badges internally)
    badgeService.getUserBadgeProgress(userId)
        .then(data => {
            res.json({
                userBadges: data.userBadges,
                badgeProgress: data.badgeProgress,
                stats: data.stats,
                newBadges: data.newBadges, // Include newly awarded badges
                completedDays: data.completedDays,
                totalDays: data.totalDays
            });
        })
        .catch(err => {
            console.error('getUserBadges error:', err);
            res.status(500).json({ success: false, error: 'Internal server error' });
        });
}

module.exports = {
    getAllBadges,
    getUserBadges
};