/**
 * Universal Statistics Manager
 * Handles data collection and storage for all games
 * Uses localStorage with 24-hour cleanup system
 * Stores highest scores only, current session data managed by individual game stats
 */
class StatsManager {
    constructor() {
        this.storageKey = 'learner_stats';
        this.cleanupInterval = null;
        this.init();
    }

    init() {
        console.log('📊 StatsManager initialized');
        this.cleanupOldData();
        this.startCleanupTimer();
    }

    /**
     * Get current stored stats for a game
     * @param {string} gameId - Game identifier (e.g., 'plusone', 'subit')
     * @returns {object} Current highest scores and metadata
     */
    getGameStats(gameId) {
        try {
            const allStats = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const gameStats = allStats[gameId] || this.getDefaultStats();
            
            // Check if data is expired
            if (this.isExpired(gameStats.lastUpdated)) {
                return this.getDefaultStats();
            }
            
            return gameStats;
        } catch (error) {
            console.warn('Error reading game stats:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Update game statistics with new session data
     * Only updates if new scores are higher than existing highest scores
     * @param {string} gameId - Game identifier
     * @param {object} sessionStats - Current session statistics
     * @param {object} metadata - Additional metadata (rounds completed, etc.)
     */
    updateGameStats(gameId, sessionStats, metadata = {}) {
        try {
            const allStats = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const currentStats = allStats[gameId] || this.getDefaultStats();
            
            // Check if data is expired and reset if needed
            if (this.isExpired(currentStats.lastUpdated)) {
                currentStats.highest = { accuracy: 0, resilience: 0, speed: 0, variety: 0 };
                currentStats.metadata = { totalRounds: 0, gamesCompleted: 0 };
            }
            
            // Update highest scores only if new scores are better
            const updated = {
                highest: {
                    accuracy: Math.max(currentStats.highest.accuracy, sessionStats.accuracy),
                    resilience: Math.max(currentStats.highest.resilience, sessionStats.resilience),
                    speed: Math.max(currentStats.highest.speed, sessionStats.speed),
                    variety: Math.max(currentStats.highest.variety, sessionStats.variety)
                },
                metadata: {
                    totalRounds: (currentStats.metadata.totalRounds || 0) + (metadata.roundsThisSession || 0),
                    gamesCompleted: (currentStats.metadata.gamesCompleted || 0) + (metadata.gamesCompletedThisSession || 0),
                    lastSessionStats: sessionStats, // For debugging/reference
                    ...metadata
                },
                lastUpdated: Date.now()
            };

            allStats[gameId] = updated;
            localStorage.setItem(this.storageKey, JSON.stringify(allStats));
            
            console.log(`📊 Updated stats for ${gameId}:`, updated);
            return updated;
        } catch (error) {
            console.warn('Error updating game stats:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * Get default/empty stats structure
     * @returns {object} Default statistics object
     */
    getDefaultStats() {
        return {
            highest: {
                accuracy: 0,    // % of questions answered correctly on first attempt
                resilience: 0,  // Combined score from active time + completion (max 100%)
                speed: 0,       // Score based on average response time (max 100%)
                variety: 0      // Whether any round has been completed (0% or 100%)
            },
            metadata: {
                totalRounds: 0,
                gamesCompleted: 0
            },
            lastUpdated: Date.now()
        };
    }

    /**
     * Get overall profile stats across all games
     * @returns {object} Aggregated statistics across all games
     */
    getOverallStats() {
        try {
            const allStats = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const gameIds = Object.keys(allStats);
            
            if (gameIds.length === 0) {
                return {
                    gamesPlayed: 0,
                    overallScores: { accuracy: 0, resilience: 0, speed: 0, variety: 0 },
                    totalRounds: 0,
                    totalCompletions: 0
                };
            }

            let totalAccuracy = 0;
            let totalResilience = 0;
            let totalSpeed = 0;
            let totalVariety = 0;
            let totalRounds = 0;
            let totalCompletions = 0;
            let validGames = 0;

            gameIds.forEach(gameId => {
                const gameStats = allStats[gameId];
                if (!this.isExpired(gameStats.lastUpdated)) {
                    totalAccuracy += gameStats.highest.accuracy;
                    totalResilience += gameStats.highest.resilience;
                    totalSpeed += gameStats.highest.speed;
                    totalVariety += gameStats.highest.variety;
                    totalRounds += gameStats.metadata.totalRounds || 0;
                    totalCompletions += gameStats.metadata.gamesCompleted || 0;
                    validGames++;
                }
            });

            return {
                gamesPlayed: validGames,
                overallScores: {
                    accuracy: validGames > 0 ? Math.round(totalAccuracy / validGames) : 0,
                    resilience: validGames > 0 ? Math.round(totalResilience / validGames) : 0,
                    speed: validGames > 0 ? Math.round(totalSpeed / validGames) : 0,
                    variety: validGames > 0 ? Math.round(totalVariety / validGames) : 0
                },
                totalRounds,
                totalCompletions
            };
        } catch (error) {
            console.warn('Error calculating overall stats:', error);
            return {
                gamesPlayed: 0,
                overallScores: { accuracy: 0, resilience: 0, speed: 0, variety: 0 },
                totalRounds: 0,
                totalCompletions: 0
            };
        }
    }

    /**
     * Check if timestamp is older than 24 hours
     * @param {number} timestamp - Timestamp to check
     * @returns {boolean} True if expired
     */
    isExpired(timestamp) {
        if (!timestamp) return true;
        const hoursSinceUpdate = (Date.now() - timestamp) / (1000 * 60 * 60);
        return hoursSinceUpdate > 24;
    }

    /**
     * Clean up expired data from localStorage
     */
    cleanupOldData() {
        try {
            const allStats = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const gameIds = Object.keys(allStats);
            let cleaned = false;

            gameIds.forEach(gameId => {
                if (this.isExpired(allStats[gameId].lastUpdated)) {
                    delete allStats[gameId];
                    cleaned = true;
                    console.log(`📊 Cleaned expired stats for ${gameId}`);
                }
            });

            if (cleaned) {
                if (Object.keys(allStats).length === 0) {
                    localStorage.removeItem(this.storageKey);
                } else {
                    localStorage.setItem(this.storageKey, JSON.stringify(allStats));
                }
            }
        } catch (error) {
            console.warn('Error cleaning up old stats:', error);
        }
    }

    /**
     * Start periodic cleanup timer (runs every hour)
     */
    startCleanupTimer() {
        // Clean up expired data every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Get stats for display on game cards (simple format)
     * @param {string} gameId - Game identifier
     * @returns {object} Display-friendly stats
     */
    getGameDisplayStats(gameId) {
        const stats = this.getGameStats(gameId);
        const hasStats = stats.metadata.totalRounds > 0;
        
        return {
            attempted: hasStats,
            completed: stats.highest.variety > 0,
            scores: hasStats ? stats.highest : null,
            rounds: stats.metadata.totalRounds || 0
        };
    }

    /**
     * Clear all statistics (for testing or user request)
     */
    clearAllStats() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('📊 All statistics cleared');
        } catch (error) {
            console.warn('Error clearing stats:', error);
        }
    }

    /**
     * Cleanup when page unloads
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create global instance
window.StatsManager = new StatsManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.StatsManager) {
        window.StatsManager.destroy();
    }
});
