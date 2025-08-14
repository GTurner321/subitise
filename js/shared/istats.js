/**
 * Interactive Stats System for Landing Page
 * Handles stats button visibility and modal interactions
 */
class InteractiveStats {
    constructor() {
        this.modal = null;
        this.modalClose = null;
        this.modalBody = null;
        this.currentAudio = null;
        
        this.init();
    }

    init() {
        console.log('📊 InteractiveStats initialized');
        
        // Get modal elements
        this.modal = document.getElementById('statsModal');
        this.modalClose = document.getElementById('statsModalClose');
        this.modalBody = document.getElementById('statsModalBody');
        
        if (!this.modal || !this.modalClose || !this.modalBody) {
            console.error('Stats modal elements not found');
            return;
        }
        
        this.setupEventListeners();
        this.updateStatsButtonVisibility();
    }

    setupEventListeners() {
        // Stats button clicks
        document.addEventListener('click', (e) => {
            const statsButton = e.target.closest('.stats-button');
            if (statsButton) {
                e.preventDefault();
                e.stopPropagation();
                const gameId = statsButton.dataset.game;
                this.openStatsModal(gameId);
            }
        });

        // Modal close events
        this.modalClose.addEventListener('click', () => {
            this.closeStatsModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeStatsModal();
            }
        });

        // Keyboard escape to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('visible')) {
                this.closeStatsModal();
            }
        });

        // Game card clicks (navigate to game)
        document.addEventListener('click', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard && !e.target.closest('.stats-button')) {
                const gameId = gameCard.dataset.game;
                this.navigateToGame(gameId);
            }
        });

        // Update stats when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateStatsButtonVisibility();
            }
        });

        window.addEventListener('focus', () => {
            this.updateStatsButtonVisibility();
        });
    }

    updateStatsButtonVisibility() {
        if (!window.StatsManager) {
            console.log('StatsManager not available yet, retrying...');
            setTimeout(() => this.updateStatsButtonVisibility(), 500);
            return;
        }

        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            const gameId = card.dataset.game;
            const statsButton = card.querySelector('.stats-button');
            
            if (!statsButton) return;

            try {
                const gameStats = window.StatsManager.getGameDisplayStats(gameId);
                
                if (gameStats.attempted) {
                    statsButton.classList.add('visible');
                }
            } catch (error) {
                console.warn(`Error checking stats for ${gameId}:`, error);
            }
        });
    }

    openStatsModal(gameId) {
        this.stopCurrentAudio();
        
        if (gameId === 'plusone') {
            this.showPlusOneStats();
        } else {
            this.showPlaceholderStats(gameId);
        }
        
        this.modal.classList.add('visible');
    }

    closeStatsModal() {
        this.stopCurrentAudio();
        this.modal.classList.remove('visible');
    }

    showPlusOneStats() {
        if (!window.StatsManager) {
            this.showPlaceholderStats('plusone');
            return;
        }

        const stats = window.StatsManager.getGameStats('plusone');
        
        if (stats.metadata.totalRounds === 0) {
            this.showNoStatsMessage('plusone');
            return;
        }

        // Create modal content
        this.modalBody.innerHTML = `
            <div class="modal-header">
                <h2>Plus One Game Stats</h2>
                <p>Your highest scores today</p>
            </div>
            
            <div class="modal-stats-grid">
                <div class="modal-stat-card accuracy" data-stat="accuracy">
                    <i class="fas fa-bullseye"></i>
                    <div class="value">${stats.highest.accuracy}%</div>
                    <div class="label">Accuracy</div>
                </div>
                
                <div class="modal-stat-card resilience" data-stat="resilience">
                    <i class="fas fa-heart"></i>
                    <div class="value">${stats.highest.resilience}%</div>
                    <div class="label">Resilience</div>
                </div>
                
                <div class="modal-stat-card speed" data-stat="speed">
                    <i class="fas fa-bolt"></i>
                    <div class="value">${stats.highest.speed}%</div>
                    <div class="label">Speed</div>
                </div>
            </div>
        `;

        // Find highest score(s) and trigger pulse + audio
        setTimeout(() => {
            this.triggerHighestScoreEffect(stats.highest);
        }, 300);
    }

    triggerHighestScoreEffect(scores) {
        const { accuracy, resilience, speed } = scores;
        const maxScore = Math.max(accuracy, resilience, speed);
        
        if (maxScore === 0) return;

        // Find all stats that match the highest score
        const highestStats = [];
        if (accuracy === maxScore) highestStats.push({ name: 'accuracy', value: accuracy });
        if (resilience === maxScore) highestStats.push({ name: 'resilience', value: resilience });
        if (speed === maxScore) highestStats.push({ name: 'speed', value: speed });

        // Randomly select one to highlight
        const selectedStat = highestStats[Math.floor(Math.random() * highestStats.length)];
        
        // Add pulsing effect
        const statCard = document.querySelector(`.modal-stat-card.${selectedStat.name}`);
        if (statCard) {
            statCard.classList.add('pulsing');
        }

        // Play audio and show explanation
        this.playStatAudio(selectedStat.name, selectedStat.value);
    }

    playStatAudio(statName, value) {
        const firstMessages = {
            accuracy: `In the Plus One game, you scored ${value}% in accuracy`,
            resilience: `In the Plus One game, you scored ${value}% in resilience`, 
            speed: `In the Plus One game, you scored ${value}% in speed`
        };

        const explanationMessages = {
            accuracy: 'This means you get a lot of questions right first time',
            resilience: 'This means you are good at sticking at the task and making improvements', 
            speed: 'This means you are fast at answering questions'
        };

        const firstMessage = firstMessages[statName];
        const explanationMessage = explanationMessages[statName];
        
        if (firstMessage && explanationMessage && window.speechSynthesis) {
            this.stopCurrentAudio();
            
            // Play first message
            const firstUtterance = new SpeechSynthesisUtterance(firstMessage);
            firstUtterance.rate = 0.9;
            firstUtterance.pitch = 1.1;
            firstUtterance.volume = 0.8;
            
            // Play explanation message after first one finishes
            firstUtterance.onend = () => {
                const explanationUtterance = new SpeechSynthesisUtterance(explanationMessage);
                explanationUtterance.rate = 0.9;
                explanationUtterance.pitch = 1.1;
                explanationUtterance.volume = 0.8;
                
                this.currentAudio = explanationUtterance;
                window.speechSynthesis.speak(explanationUtterance);
            };
            
            this.currentAudio = firstUtterance;
            window.speechSynthesis.speak(firstUtterance);
        }
    }

    showStatExplanation(statName) {
        // Remove this method as explanations are now audio-only
    }

    showNoStatsMessage(gameId) {
        const gameName = this.getGameDisplayName(gameId);
        
        this.modalBody.innerHTML = `
            <div class="no-stats-modal">
                <i class="fas fa-chart-line"></i>
                <h3>No Stats Yet</h3>
                <p>Play ${gameName} to see your statistics here!</p>
            </div>
        `;
    }

    showPlaceholderStats(gameId) {
        const gameName = this.getGameDisplayName(gameId);
        
        this.modalBody.innerHTML = `
            <div class="no-stats-modal">
                <i class="fas fa-cog"></i>
                <h3>Stats Coming Soon</h3>
                <p>Statistics for ${gameName} are not available yet. Only Plus One currently tracks detailed stats.</p>
            </div>
        `;
    }

    getGameDisplayName(gameId) {
        const gameNames = {
            'subitise': 'Subitise',
            'add': 'Addition',
            'twodice': 'Two Dice',
            'plusone': 'Plus One',
            'trace': 'Number Tracing',
            'draw': 'Draw Numbers',
            'balloon': 'Balloon Game',
            'raisin': 'Raisin Game',
            'sliderrandom': 'Slider Random',
            'slider': 'Slider 2, 3, 4, 5',
            'stacks': 'Stacks',
            'trumps': 'Teddy Trumps'
        };
        
        return gameNames[gameId] || gameId;
    }

    navigateToGame(gameId) {
        // Map game IDs to actual paths
        const gamePaths = {
            'subitise': 'games/subitising/index.html',
            'add': 'games/add/index.html', 
            'twodice': 'games/twodice/index.html',
            'plusone': 'games/plusone/index.html',
            'trace': 'games/trace/index.html',
            'draw': 'games/draw/index.html',
            'balloon': 'games/balloon/index.html',
            'raisin': 'games/raisin/index.html',
            'sliderrandom': 'games/sliderrandom/index.html',
            'slider': 'games/slider/index.html',
            'stacks': 'games/stacks/index.html',
            'trumps': 'games/trumps/index.html'
            'trumps2': 'games/trumps2/index.html'
        };
        
        const path = gamePaths[gameId];
        if (path) {
            window.location.href = path;
        } else {
            console.warn(`Unknown game ID: ${gameId}`);
        }
    }

    stopCurrentAudio() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.currentAudio = null;
    }

    destroy() {
        this.stopCurrentAudio();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveStats = new InteractiveStats();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.interactiveStats) {
        window.interactiveStats.destroy();
    }
});
