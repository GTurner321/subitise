class PlusOneGameController {
    constructor() {
        console.log('🎮 Plus One Game Controller - Triple Mode Version');
        
        // Initialize components
        this.contentRenderer = new PlusOneContentRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Initialize game logic and UI managers
        this.gameLogic = new PlusOneGameLogic(this);
        this.uiManager = new PlusOneUIManager(this);
        
        // Game mode and progression
        this.gameMode = CONFIG.GAME_MODES.PLUS_ONE; // Default to plus one
        this.currentLevel = this.loadStoredLevel(this.gameMode);
        this.questionsCompleted = 0;
        this.gameComplete = false;
        
        // Track used numbers per level to avoid repetition
        this.usedNumbersInLevel = new Set();
        
        // Level progression tracking for redemption system
        this.failedAtCurrentLevel = false;
        
        // Game state
        this.currentNumber = 0; // The 'n' in n+1, n-1, or n+2
        this.currentAnswer = 0; // n+1, n-1, or n+2
        this.buttonsDisabled = false;
        this.hasAttemptedAnyAnswer = false;
        
        // Box state tracking
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
        // Track current question type for smooth transitions
        this.currentQuestionType = null; // 'picture' or 'number'
        this.previousQuestionType = null;
        
        // System readiness and initial fade control
        this.systemsReady = false;
        this.initializationComplete = false;
        this.readyCheckCount = 0;
        this.initialFadeStarted = false;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.gameArea = document.querySelector('.game-area');
        this.leftPulseArea = document.getElementById('leftPulseArea');
        this.rightPulseArea = document.getElementById('rightPulseArea');
        
        // Initialize
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.setupTouchProtection();
        this.waitForSystemsAndInitialize();
    }

    // ===== GAME MODE AND LEVEL MANAGEMENT =====
    
    loadStoredLevel(gameMode) {
        try {
            let key;
            if (gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                key = CONFIG.STORAGE_KEYS.MINUS_ONE_LEVEL;
            } else if (gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                key = CONFIG.STORAGE_KEYS.PLUS_TWO_LEVEL;
            } else {
                key = CONFIG.STORAGE_KEYS.PLUS_ONE_LEVEL;
            }
            
            const stored = sessionStorage.getItem(key);
            return stored ? parseInt(stored, 10) : 1;
        } catch (error) {
            console.warn('Could not load stored level:', error);
            return 1;
        }
    }

    saveCurrentLevel() {
        try {
            let key;
            if (this.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                key = CONFIG.STORAGE_KEYS.MINUS_ONE_LEVEL;
            } else if (this.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
                key = CONFIG.STORAGE_KEYS.PLUS_TWO_LEVEL;
            } else {
                key = CONFIG.STORAGE_KEYS.PLUS_ONE_LEVEL;
            }
            
            sessionStorage.setItem(key, this.currentLevel.toString());
        } catch (error) {
            console.warn('Could not save current level:', error);
        }
    }

    switchGameMode(newGameMode) {
        this.gameMode = newGameMode;
        this.currentLevel = Math.min(this.loadStoredLevel(newGameMode), 4); // Start at saved level or level 4, whichever is lowest
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.usedNumbersInLevel.clear();
        this.failedAtCurrentLevel = false;
        this.resetQuestionState();
        
        // Update the operator symbol in the middle section
        this.updateOperatorSymbol();
        
        console.log(`🔄 Switched to ${newGameMode} mode, starting at level ${this.currentLevel}`);
    }

    // ===== HELPER FUNCTIONS =====
    
    shouldUsePictureFormat() {
        return CONFIG.usesPictureFormat(this.currentLevel, this.gameMode);
    }

    shouldUseNumberFormat() {
        return !this.shouldUsePictureFormat();
    }

    getCurrentLevels() {
        return CONFIG.getLevels(this.gameMode);
    }

    getCurrentAudio() {
        if (this.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
            return CONFIG.AUDIO.MINUS_ONE;
        } else if (this.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
            return CONFIG.AUDIO.PLUS_TWO;
        } else {
            return CONFIG.AUDIO.PLUS_ONE;
        }
    }

    calculateAnswer(number) {
        if (this.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
            return number - 1;
        } else if (this.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
            return number + 2;
        } else {
            return number + 1;
        }
    }

    getOperatorSymbol() {
        if (this.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
            return '-';
        } else {
            return '+'; // Both Plus One and Plus Two use +
        }
    }

    getOperatorValue() {
        if (this.gameMode === CONFIG.GAME_MODES.PLUS_TWO) {
            return 2;
        } else {
            return 1; // Both Plus One and Minus One use 1
        }
    }

    // ===== SYSTEM INITIALIZATION =====
    
    waitForSystemsAndInitialize() {
        console.log('🎮 Checking system readiness...');
        
        const checkSystemsReady = () => {
            this.readyCheckCount++;
            
            const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
            const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
            
            if (buttonBarReady && gameAreaReady) {
                console.log(`🎮 Systems ready after ${this.readyCheckCount} checks`);
                this.systemsReady = true;
                
                if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
                    this.contentRenderer.setupButtonBarCoordination();
                }
                
                this.createButtons();
                
                setTimeout(() => {
                    this.initializeGame();
                }, CONFIG.BUTTON_SETUP_DELAY);
                
                return;
            }
            
            if (this.readyCheckCount >= CONFIG.MAX_READY_CHECKS) {
                console.warn('⚠️ Systems not ready, forcing initialization');
                this.systemsReady = true;
                this.forceInitialization();
                return;
            }
            
            setTimeout(checkSystemsReady, CONFIG.SYSTEM_CHECK_INTERVAL);
        };
        
        checkSystemsReady();
    }

    forceInitialization() {
        console.log('🚨 Force initializing game systems');
        this.systemsReady = true;
        
        if (this.contentRenderer && typeof this.contentRenderer.setupButtonBarCoordination === 'function') {
            try {
                this.contentRenderer.setupButtonBarCoordination();
            } catch (error) {
                console.warn('Content renderer setup failed:', error);
            }
        }
        
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            try {
                this.createButtons();
            } catch (error) {
                console.warn('Button creation failed:', error);
            }
        }
        
        setTimeout(() => {
            this.initializeGame();
        }, CONFIG.BUTTON_SETUP_DELAY);
    }

    initializeGame() {
        console.log('🎮 Starting game initialization');
        
        // Set the correct operator symbol from the start
        this.updateOperatorSymbol();
        
        // Start all elements at 0% opacity
        this.hideAllElements();
        
        // Set up game area for controlled fade-in
        setTimeout(() => {
            if (this.sumRow) {
                this.sumRow.classList.add('sum-bar-ready');
            }
        }, CONFIG.INITIAL_FADE_DELAY);
        
        // Wait for initial delay, then fade everything in together
        setTimeout(() => {
            this.controlledFadeIn();
            this.initializationComplete = true;
            
            setTimeout(() => {
                this.gameLogic.startNewQuestion();
            }, 500);
            
        }, CONFIG.INITIAL_FADE_DELAY);
    }

    updateOperatorSymbol() {
        // Update the operator symbol in the middle section
        const operatorIcon = document.getElementById('operatorIcon');
        if (operatorIcon) {
            if (this.gameMode === CONFIG.GAME_MODES.MINUS_ONE) {
                operatorIcon.className = 'fas fa-minus';
            } else {
                operatorIcon.className = 'fas fa-plus';
            }
        }
    }

    hideAllElements() {
        // Set all elements to 0% opacity initially
        if (this.gameArea) {
            this.gameArea.style.opacity = '0';
            this.gameArea.classList.remove('loaded');
        }
        
        const buttonContainer = document.querySelector('.number-buttons');
        if (buttonContainer) {
            buttonContainer.style.opacity = '0';
            buttonContainer.classList.remove('loaded');
        }
    }

    controlledFadeIn() {
        console.log('🎭 Starting controlled fade-in');
        this.initialFadeStarted = true;
        
        // Fade in game area
        if (this.gameArea) {
            this.gameArea.classList.add('dimensions-ready', 'loaded');
            this.gameArea.style.transition = 'opacity 1s ease-in-out';
            this.gameArea.style.opacity = '1';
        }
        
        // Fade in button container
        const buttonContainer = document.querySelector('.number-buttons');
        if (buttonContainer) {
            buttonContainer.classList.add('loaded');
            buttonContainer.style.transition = 'opacity 1s ease-in-out';
            buttonContainer.style.opacity = '1';
        }
    }

    // ===== BUTTON CREATION AND MANAGEMENT =====
    
    createButtons() {
        const isPictureFormat = this.shouldUsePictureFormat();
        const config = isPictureFormat ? CONFIG.BUTTON_CONFIGS.PICTURE_FORMAT : CONFIG.BUTTON_CONFIGS.NUMBER_FORMAT;
        
        console.log(`Creating buttons: ${isPictureFormat ? 'Picture' : 'Number'} format (${config.count} buttons) for ${this.gameMode}`);
        
        const colors = CONFIG.COLORS.slice(0, config.count);
        let numbers = isPictureFormat ? [...config.numbers] : [1, 2, 3, 4];
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    config.count,
                    config.width,
                    config.height,
                    colors,
                    numbers,
                    (selectedNumber, buttonElement) => {
                        if (this.buttonsDisabled || this.gameComplete) return;
                        
                        this.gameLogic.handleNumberClick(selectedNumber, buttonElement);
                    }
                );
            }
        }, 50);
    }

    // ===== EVENT LISTENERS AND SETUP =====
    
    initializeEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        const keyboardHandler = (e) => {
            if (this.buttonsDisabled || this.gameComplete) return;
            
            if (!this.systemsReady) return;
            
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                console.log('⌨️ Keyboard digit accepted:', e.key);
                
                const digit = parseInt(e.key);
                this.gameLogic.handleKeyboardDigit(digit);
            }
        };
        
        document.addEventListener('keydown', keyboardHandler);
        
        if (document.activeElement !== document.body) {
            document.body.focus();
        }
        
        this.keyboardHandler = keyboardHandler;
    }

    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            this.uiManager.handleVisibilityChange(!document.hidden);
        });
    }

    setupTouchProtection() {
        const gameAreaElements = [this.gameArea, this.leftSide, this.rightSide];
        
        gameAreaElements.forEach(element => {
            if (element) {
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                element.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                });
                
                element.addEventListener('touchend', (e) => {
                    if (e.target.closest('.number-btn, .back-button, .audio-button-container')) {
                        return;
                    }
                    e.preventDefault();
                });
            }
        });
    }

    // ===== GAME MANAGEMENT =====
    
    startNewGame() {
        console.log(`New game: Starting ${this.gameMode} at level ${Math.min(this.currentLevel, 4)}`);
        
        // Apply level 4 cap for new games
        this.currentLevel = Math.min(this.currentLevel, 4);
        
        // Debug: Log starting level information
        const levelConfig = this.getCurrentLevels()[this.currentLevel];
        const willUsePictureFormat = this.shouldUsePictureFormat();
        console.log(`🚀 Starting game - Level ${this.currentLevel}: ${levelConfig.name}, Format: ${willUsePictureFormat ? 'Pictures' : 'Numbers'}, Numbers: [${levelConfig.numbers.join(', ')}]`);
        
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.usedNumbersInLevel.clear();
        this.failedAtCurrentLevel = false;
        
        // Reset question type tracking for new game
        this.currentQuestionType = null;
        this.previousQuestionType = null;
        
        // Update operator symbol for current game mode
        this.updateOperatorSymbol();
        
        this.rainbow.reset();
        this.bear.reset();
        this.contentRenderer.reset();
        this.modal.classList.add('hidden');
        
        this.initializationComplete = true;
        
        // Always recreate buttons for new game
        this.createButtons();
        
        setTimeout(() => {
            this.gameLogic.startNewQuestion();
        }, 200);
    }

    completeGame() {
        this.gameComplete = true;
        
        // Update modal for triple-button layout
        this.uiManager.updateModalForCompletion();
        this.modal.classList.remove('hidden');
        
        this.bear.startCelebration();
        
        if (this.uiManager.isTabVisible) {
            const audioConfig = this.getCurrentAudio();
            setTimeout(() => {
                this.uiManager.speakText(audioConfig.GAME_COMPLETE);
            }, 1000);
        }
    }

    resetQuestionState() {
        this.resetBoxState();
        this.hasAttemptedAnyAnswer = false;
        this.usedAnswersInCurrentQuestion = new Set();
        this.gameLogic.resetKeyboardState();
    }

    resetBoxState() {
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        this.uiManager.stopFlashing();
    }

    destroy() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.contentRenderer.reset();
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        // Remove modal button styles
        const modalButtonStyles = document.head.querySelector('style[data-modal-buttons]');
        if (modalButtonStyles) {
            modalButtonStyles.remove();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, creating PlusOneGameController (Triple Mode Version)');
    window.plusOneGame = new PlusOneGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.plusOneGame) {
        window.plusOneGame.destroy();
    }
    // Clear session storage when leaving the game
    CONFIG.clearStoredLevels();
});

// Also clear levels when navigating away via links
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && !link.href.includes('plusone')) {
        // User is navigating away from the plusone game
        CONFIG.clearStoredLevels();
    }
});
