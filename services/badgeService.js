const badgeModel = require('../models/badgesModel');

// Badge definitions with their IDs (should match your badges table)
const BADGES = {
    MISSION_FAILED: 1,
    GREEN_BEAN_ROOKIE: 2,
    WEAK_NO_MORE: 3,
    CONSISTENCY_CHAMP: 4,
    STREAK_FREAK: 6,
    GOAL_DIGGER: 5,
    CHALLENGE_COMPLETED: 7
};

// Get user's badge progress summary
let getUserBadgeProgress = async (userId) => {
    try {
        const stats = await badgeModel.getUserChallengeStats(userId);
        const hasFailures = await badgeModel.userHasFailures(userId);

        const badgeProgress = {
            'Green Bean Rookie': stats.total_days >= 1,
            'I Repeat, Mission Failed': hasFailures,
            'Weak No More': stats.completed_days >= 15,
            'Consistency Champ': stats.completed_days >= 30,
            'Streak Freak': stats.completed_days >= 45,
            'Goal-Digger': stats.completed_days >= 60,
            'Challenge? I Hardly Know Her': stats.completed_days >= 75
        };

        let newBadges = [];

        if (badgeProgress['Green Bean Rookie']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.GREEN_BEAN_ROOKIE);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.GREEN_BEAN_ROOKIE);
                newBadges.push('Green Bean Rookie');
            }
        }

        if (badgeProgress['I Repeat, Mission Failed']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.MISSION_FAILED);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.MISSION_FAILED);
                newBadges.push('I Repeat, Mission Failed');
            }
        }

        // Weak No More - Day 15-20
        if (badgeProgress['Weak No More']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.WEAK_NO_MORE);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.WEAK_NO_MORE);
                newBadges.push('Weak No More');
            }
        }

        // Consistency Champ - Day 30
        if (badgeProgress['Consistency Champ']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.CONSISTENCY_CHAMP);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.CONSISTENCY_CHAMP);
                newBadges.push('Consistency Champ');
            }
        }

        // Streak Freak - Day 45-50
        if (badgeProgress['Streak Freak']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.STREAK_FREAK);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.STREAK_FREAK);
                newBadges.push('Streak Freak');
            }
        }

        // Goal-Digger - Day 60
        if (badgeProgress['Goal-Digger']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.GOAL_DIGGER);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.GOAL_DIGGER);
                newBadges.push('Goal-Digger');
            }
        }

        // Challenge? I Hardly Know Her - Day 75 (completion)
        if (badgeProgress['Challenge? I Hardly Know Her']) {
            const hasBadge = await badgeModel.userHasBadge(userId, BADGES.CHALLENGE_COMPLETED);
            if (!hasBadge) {
                await badgeModel.awardBadge(userId, BADGES.CHALLENGE_COMPLETED);
                newBadges.push('Challenge? I Hardly Know Her');
            }
        }

        const userBadges = await badgeModel.getUserBadges(userId);

        return {
            stats,
            userBadges,
            newBadges,
            badgeProgress,
            completedDays: stats.completed_days || 0,
            totalDays: stats.total_days || 0
        };
    } catch (error) {
        console.error('Error getting user badge progress:', error);
        throw error;
    }
};

module.exports = {
    getUserBadgeProgress,
    BADGES
};