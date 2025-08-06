/**
 * Plus One Game Statistics Tracker
 * Tracks 4 metrics and converts them to scores out of 100:
 * 1) Accuracy - Questions answered correctly on first attempt
 * 2) Resilience - Active time + completion status  
 * 3) Speed - Average response time converted to score
 * 4) Variety - Whether any round has been completed
 */
class PlusOneStats {
    constructor() {
        this.gameId = 'plusone';
        this.resetSessionData();
        
        // Timing management
        this.questionStartTime = null;
        this.totalActiveTime = 0;
        this.lastActivityTime = Date.now();
        this.inactivityThreshold = 20000; // 20 seconds
        this.activityTimer = null;
        this.isTabVisible = true;
        this.isPaused = false;
        
        this.init();
    }

    init() {
        console.log('📈 PlusOneStats initialized');
        this.startActivityTracking();
        this.setupVisibilityHandling();
    }

    /**
     * Reset all session data for new session
     */
    resetSessionData() {
        // 1) Accuracy tracking
        this.totalQuestions = 0;
        this.correctFirstAttempts = 0;
        
        // 2) Resilience tracking  
        this.roundsCompleted = 0;
        this.anyRoundCompleted = false;
        
        // 3) Speed tracking
        this.questionTimes = [];
        
        // 4) Variety tracking
        this.completedAnyRound = false;
        
        console.log('📈 Session data reset');
    }

    /**
     * Setup tab visibility handling for accurate timing
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            const wasVisible = this.isTabVisible;
            this.isTabVisible = !document.hidden;
            
            if (wasVisible && !this.isTabVisible) {
                // Tab became hidden - pause timing
                this.pauseActivityTracking();
            } else if (!wasVisible && this.isTabVisible) {
                // Tab became visible - resume timing
                this.resumeActivityTracking();
            }
        });
    }

    /**
     * Start activity time tracking
     */
    startActivityTracking() {
        this.lastActivityTime = Date.now();
        this.isPaused = false;
        
        // Check for inactivity every second
        this.activityTimer = setInterval(() => {
            if (!this.isPaused && this.isTabVisible) {
                const timeSinceActivity = Date.now() - this.lastActivityTime;
                
                if (timeSinceActivity >= this.inactivityThreshold) {
                    // User has been inactive - don't count this time
                    this.pauseActivityTracking();
                }
            }
        }, 1000);
    }

    /**
     * Register user activity (called by game controller)
     */
    registerActivity() {
        const now = Date.now();
        
        // If we were paused due to inactivity, resume and don't count gap time
        if (this.isPaused) {
            this.resumeActivityTracking();
        } else if (this.isTabVisible) {
            // Add time since last activity to total
            this.totalActiveTime += now - this.lastActivityTime;
        }
        
        this.lastActivityTime = now;
    }

    /**
     * Pause activity tracking
     */
    pauseActivityTracking() {
        if (!this.isPaused && this.isTabVisible) {
            // Add time up to pause point
            this.totalActiveTime += Date.now() - this.lastActivityTime;
        }
        this.isPaused = true;
    }

    /**
     * Resume activity tracking
     */
    resumeActivityTracking() {
        this.isPaused = false;
        this.lastActivityTime = Date.now();
    }

    /**
     * Start timing a question (called when question becomes ready for input)
     */
    startQuestionTimer() {
        this.questionStartTime = Date.now();
        this.registerActivity();
    }

    /**
     * Record question attempt (called when user clicks/types answer)
     * @param {boolean} wasCorrectFirstAttempt - Whether the answer was correct on first try
     */
    recordQuestionAttempt(wasCorrectFirstAttempt) {
        this.totalQuestions++;
        
        // Record accuracy
        if (wasCorrectFirstAttempt) {
            this.correctFirstAttempts++;
        }
        
        // Record speed (time from question start to first attempt)
        if (this.questionStartTime) {
            const responseTime = (Date.now() - this.questionStartTime) / 1000; // Convert to seconds
            this.questionTimes.push(responseTime);
            this.questionStartTime = null;
        }
        
        this.registerActivity();
        
        console.log(`📈 Question recorded: Correct first attempt: ${wasCorrectFirstAttempt}, Total questions: ${this.totalQuestions}`);
    }

    /**
     * Record round completion (called when 10 questions completed)
     */
    recordRoundCompletion() {
        this.roundsCompleted++;
        this.completedAnyRound = true;
        this.registerActivity();
        
        console.log(`📈 Round completed: Total rounds: ${this.roundsCompleted}`);
    }

    /**
     * Calculate accuracy score (0-100%)
     * Based on: questions answered correctly on first attempt / total questions
     * @returns {number} Accuracy percentage (0-100)
     */
    calculateAccuracyScore() {
        if (this.totalQuestions === 0) return 0;
        return Math.round((this.correctFirstAttempts / this.totalQuestions) * 100);
    }

    /**
     * Calculate resilience score (0-100%)
     * Based on: active time spent + completion status with round completion bonuses
     * - If any round completed: 100%
     * - After round 1: minimum 60% (120 seconds equivalent)
     * - After round 2: can advance to 100%
     * - Otherwise: (active seconds / 200) * 100%
     * @returns {number} Resilience percentage (0-100)
     */
    calculateResilienceScore() {
        // Add current session time if not paused
        let currentActiveTime = this.totalActiveTime;
        if (!this.isPaused && this.isTabVisible) {
            currentActiveTime += Date.now() - this.lastActivityTime;
        }
        
        const activeSeconds = currentActiveTime / 1000;
        
        // If completed any round, automatic 100%
        if (this.completedAnyRound) {
            return 100;
        }
        
        // Calculate base percentage from time
        let basePercentage = Math.round((activeSeconds / 200) * 100);
        
        // Apply round completion bonuses
        if (this.roundsCompleted >= 2) {
            // After round 2: can advance to 100%
            basePercentage = Math.max(basePercentage, 100);
        } else if (this.roundsCompleted >= 1) {
            // After round 1: minimum 60% (equivalent to 120 seconds)
            basePercentage = Math.max(basePercentage, 60);
        }
        
        // Cap at 100%
        return Math.min(basePercentage, 100);
    }

    /**
     * Calculate speed score (0-100%)
     * Based on average response time with game-specific conversion:
     * - < 2 seconds: 100%
     * - 2-12 seconds: (110 - 5n)%
     * - 12-42 seconds: (70 - 10*n/6)%  
     * - > 42 seconds: 0%
     * @returns {number} Speed percentage (0-100)
     */
    calculateSpeedScore() {
        if (this.questionTimes.length === 0) return 0;
        
        // Calculate average response time
        const totalTime = this.questionTimes.reduce((sum, time) => sum + time, 0);
        const averageTime = totalTime / this.questionTimes.length;
        
        // Apply conversion formula
        if (averageTime < 2) {
            return 100;
        } else if (averageTime <= 12) {
            return Math.round(110 - (5 * averageTime));
        } else if (averageTime <= 42) {
            return Math.round(70 - (10 * averageTime / 6));
        } else {
            return 0;
        }
    }

    /**
     * Calculate variety score (0% or 100%)
     * Based on: whether any round has been completed
     * @returns {number} Variety percentage (0 or 100)
     */
    calculateVarietyScore() {
        return this.completedAnyRound ? 100 : 0;
    }

    /**
     * Get current session statistics
     * @returns {object} Current session stats with breakdown
     */
    getCurrentStats() {
        const stats = {
            accuracy: this.calculateAccuracyScore(),
            resilience: this.calculateResilienceScore(), 
            speed: this.calculateSpeedScore(),
            variety: this.calculateVarietyScore()
        };
        
        // Add debug information
        const activeSeconds = this.totalActiveTime / 1000;
        const avgTime = this.questionTimes.length > 0 ? 
            (this.questionTimes.reduce((sum, time) => sum + time, 0) / this.questionTimes.length) : 0;
            
        console.log(`📈 Current Stats:`, {
            ...stats,
            debug: {
                totalQuestions: this.totalQuestions,
                correctFirstAttempts: this.correctFirstAttempts,
                roundsCompleted: this.roundsCompleted,
                activeTimeSeconds: Math.round(activeSeconds),
                averageResponseTime: Math.round(avgTime * 100) / 100,
                questionTimes: this.questionTimes
            }
        });
        
        return stats;
    }

    /**
     * Submit current session stats to global stats manager
     */
    submitStats() {
        if (!window.StatsManager) {
            console.warn('📈 StatsManager not available');
            return;
        }
        
        const sessionStats = this.getCurrentStats();
        const metadata = {
            roundsThisSession: this.roundsCompleted,
            gamesCompletedThisSession: this.completedAnyRound ? 1 : 0,
            totalQuestionsThisSession: this.totalQuestions,
            activeTimeThisSession: Math.round(this.totalActiveTime / 1000)
        };
        
        const updatedStats = window.StatsManager.updateGameStats(this.gameId, sessionStats, metadata);
        
        console.log('📈 Stats submitted to StatsManager:', updatedStats);
        return updatedStats;
    }

    /**
     * Get stored stats from stats manager
     * @returns {object} Stored statistics
     */
    getStoredStats() {
        if (!window.StatsManager) {
            console.warn('📈 StatsManager not available');
            return null;
        }
        
        return window.StatsManager.getGameStats(this.gameId);
    }

    /**
     * Reset stats and start fresh session (called when returning from main page)
     */
    startNewSession() {
        // Submit current stats before resetting
        if (this.totalQuestions > 0) {
            this.submitStats();
        }
        
        this.resetSessionData();
        this.totalActiveTime = 0;
        this.lastActivityTime = Date.now();
        this.resumeActivityTracking();
        
        console.log('📈 New session started');
    }

    /**
     * Cleanup when leaving the game
     */
    destroy() {
        // Submit final stats
        if (this.totalQuestions > 0) {
            this.submitStats();
        }
        
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
        
        console.log('📈 PlusOneStats destroyed');
    }
}

// Global instance will be created by the game controller
window.PlusOneStats = PlusOneStats;
