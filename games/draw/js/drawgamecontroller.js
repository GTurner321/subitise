/**
 * Draw Game Controller - Complete with UI Management
 * 
 * PURPOSE: Coordinates all game systems and manages game flow with UI feedback
 * - Manages game progression through all 10 numbers (0-9)
 * - Handles game state, completion detection, and user feedback
 * - Coordinates audio announcements and visual celebrations
 * - REFACTORED: Now handles reset button flashing and flooding UI feedback
 * - Manages game restart and cleanup functionality
 * - Faster initialization without complex verification
 */

class DrawGameController {
    constructor() {
        console.log('🎮 DrawGameController initializing with UI management');
        
        // Game state
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        
        // Check if config is available
        if (typeof DRAW_CONFIG === 'undefined') {
            console.error('❌ DRAW_CONFIG is not defined! Check script loading order.');
            return;
        }
        
        // Numbers sequence from config
        this.numbersSequence = [...DRAW_CONFIG.NUMBERS_SEQUENCE];
        
        // Component instances
        this.layoutRenderer = null;
        this.drawingRenderer = null;
        this.rainbow = null;
        this.bear = null;
        
        // DOM elements
        this.modal = null;
        this.playAgainBtn = null;
        
        // Audio state
        this.isTabVisible = true;
        this.audioEnabled = true;
        
        // NEW: Reset button flashing management
        this.resetButtonFlashing = false;
        this.flashInterval = null;
        
        // Bind methods for event handlers
        this.onNumberComplete = this.onNumberComplete.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePlayAgain = this.handlePlayAgain.bind(this);
        
        // Initialize game
        this.initializeGame();
    }
    
    /**
     * SIMPLIFIED: Fast initialization without complex verification
     */
    async initializeGame() {
        console.log('🚀 Fast initialization sequence');
        
        try {
            // Wait for DOM
            await this.waitForDOM();
            console.log('✅ DOM ready');
            
            // Simple setup
            this.initializeAudioSystem();
            this.setupVisibilityHandling();
            this.setupGameUI();
            console.log('✅ Basic systems ready');
            
            // Wait for game area (with shorter timeout)
            await this.waitForGameAreaReady();
            console.log('✅ Game area ready');
            
            // Initialize components
            await this.initializeSharedComponents();
            console.log('✅ Shared components ready');
            
            // Initialize renderers
            await this.initializeRenderers();
            console.log('✅ Renderers ready');
            
            // Start immediately
            this.startGame();
            console.log('✅ Fast initialization complete');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.handleInitializationFailure(error);
        }
    }
    
    /**
     * Wait for DOM to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * FASTER: Wait for game area with reduced timeout
     */
    waitForGameAreaReady() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds max wait instead of 5
            
            const checkGameArea = () => {
                attempts++;
                
                const gameArea = document.querySelector('.game-area');
                const rainbowContainer = document.getElementById('rainbowContainer');
                
                if (gameArea && rainbowContainer) {
                    const rect = gameArea.getBoundingClientRect();
                    if (rect.width > 100 && rect.height > 100) {
                        console.log(`🎯 Game area ready: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}px`);
                        resolve();
                        return;
                    }
                }
                
                if (attempts >= maxAttempts) {
                    console.log('⚡ Game area setup complete, proceeding');
                    resolve();
                } else {
                    setTimeout(checkGameArea, 100);
                }
            };
            
            checkGameArea();
        });
    }
    
    /**
     * Initialize shared components with better timing
     */
    async initializeSharedComponents() {
        console.log('🌈 Initializing shared components');
        
        // Initialize Rainbow
        try {
            if (window.Rainbow && typeof window.Rainbow === 'function') {
                this.rainbow = new window.Rainbow();
                console.log('✅ Rainbow initialized successfully');
            } else {
                console.warn('⚠️ Rainbow class not found, creating dummy implementation');
                this.rainbow = this.createDummyRainbow();
            }
        } catch (error) {
            console.error('❌ Rainbow initialization failed:', error);
            this.rainbow = this.createDummyRainbow();
        }
        
        // Initialize Bear
        try {
            if (window.Bear && typeof window.Bear === 'function') {
                this.bear = new window.Bear();
                console.log('✅ Bear initialized successfully');
            } else {
                console.warn('⚠️ Bear class not found, creating dummy implementation');
                this.bear = this.createDummyBear();
            }
        } catch (error) {
            console.error('❌ Bear initialization failed:', error);
            this.bear = this.createDummyBear();
        }
        
        console.log('✅ All shared components initialized');
    }
    
    /**
     * Initialize audio system
     */
    initializeAudioSystem() {
        console.log('🔊 Initializing audio system');
        
        if (window.AudioSystem) {
            this.audioEnabled = window.AudioSystem.audioEnabled;
            console.log('✅ Audio system ready');
        } else {
            console.warn('⚠️ Audio system not available');
            this.audioEnabled = false;
        }
    }
    
    /**
     * Setup tab visibility handling
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        window.addEventListener('focus', () => {
            this.isTabVisible = true;
        });
        
        window.addEventListener('blur', () => {
            this.isTabVisible = false;
        });
    }
    
    /**
     * Handle visibility changes
     */
    handleVisibilityChange() {
        this.isTabVisible = !document.hidden;
        
        if (!this.isTabVisible) {
            if (window.AudioSystem) {
                window.AudioSystem.stopAllAudio();
            }
        }
        
        console.log(`👁️ Tab visibility: ${this.isTabVisible ? 'visible' : 'hidden'}`);
    }
    
    /**
     * Create dummy rainbow implementation for fallback
     */
    createDummyRainbow() {
        return {
            addPiece: () => {
                console.log('🌈 Dummy rainbow: piece added');
                return 1;
            },
            isComplete: () => false,
            reset: () => console.log('🌈 Dummy rainbow: reset'),
            getPieces: () => 0,
            initializeArcs: () => console.log('🌈 Dummy rainbow: arcs initialized')
        };
    }
    
    /**
     * Create dummy bear implementation for fallback
     */
    createDummyBear() {
        return {
            startCelebration: () => console.log('🐻 Dummy bear: celebration started'),
            stopCelebration: () => console.log('🐻 Dummy bear: celebration stopped'),
            reset: () => console.log('🐻 Dummy bear: reset')
        };
    }
    
    /**
     * Setup game UI elements
     */
    setupGameUI() {
        console.log('🎨 Setting up game UI');
        
        // Find modal elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        if (!this.modal || !this.playAgainBtn) {
            console.error('❌ Required UI elements not found');
            return;
        }
        
        // Setup play again button
        this.playAgainBtn.addEventListener('click', this.handlePlayAgain);
        this.playAgainBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePlayAgain();
        });
        
        // Initially hide modal
        this.modal.classList.add('hidden');
        
        console.log('✅ Game UI setup complete');
    }
    
    /**
     * Initialize the renderer systems
     */
    async initializeRenderers() {
        console.log('🎨 Initializing renderer systems');
        
        // Initialize layout renderer first
        this.layoutRenderer = new DrawLayoutRenderer();
        
        // Wait for layout to be ready
        await this.waitForLayoutReady();
        
        // Initialize drawing renderer
        this.drawingRenderer = new DrawingRenderer(this.layoutRenderer);
        
        // Make drawing renderer globally available for undo button
        window.drawingRenderer = this.drawingRenderer;
        
        // Make game controller globally available for completion callbacks
        window.drawGameController = this;
        
        console.log('✅ Renderer systems initialized');
    }
    
    /**
     * Wait for layout renderer to be ready
     */
    waitForLayoutReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (this.layoutRenderer && this.layoutRenderer.isLayoutReady()) {
                    resolve();
                } else {
                    setTimeout(checkReady, 50);
                }
            };
            checkReady();
        });
    }
    
    /**
     * Handle initialization failure with graceful degradation
     */
    handleInitializationFailure(error) {
        console.error('🚨 Initialization failed, attempting recovery:', error);
        
        // Try to start with minimal systems
        try {
            if (this.layoutRenderer && this.drawingRenderer) {
                console.log('🔧 Starting with minimal systems');
                this.startGame();
            } else {
                console.error('💥 Critical systems missing, cannot start game');
            }
        } catch (recoveryError) {
            console.error('💥 Recovery failed:', recoveryError);
        }
    }
    
    /**
     * Start the game with first number
     */
    startGame() {
        console.log('🎯 Starting new game');
        
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        
        // Reset shared components
        if (this.rainbow) {
            this.rainbow.reset();
            console.log('🌈 Rainbow reset');
        }
        
        if (this.bear) {
            this.bear.reset();
            console.log('🐻 Bear reset');
        }
        
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
        // Stop any button flashing
        this.stopResetButtonFlashing();
        
        // Start first number
        this.startNextNumber();
        
        // Play welcome message
        this.playWelcomeMessage();
    }
    
    /**
     * Play welcome message for first number
     */
    playWelcomeMessage() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        const firstNumber = this.numbersSequence[0];
        
        setTimeout(() => {
            this.speakText(DRAW_CONFIG.AUDIO.GAME_START.WELCOME);
            
            setTimeout(() => {
                this.speakText(DRAW_CONFIG.AUDIO.GAME_START.INSTRUCTIONS(firstNumber));
            }, 2000);
        }, 1000);
    }
    
    /**
     * Start the next number in sequence
     */
    startNextNumber() {
        if (this.currentNumberIndex >= this.numbersSequence.length) {
            this.completeGame();
            return;
        }
        
        const currentNumber = this.numbersSequence[this.currentNumberIndex];
        console.log(`🔢 Starting number ${currentNumber} (${this.currentNumberIndex + 1}/${this.numbersSequence.length})`);
        
        // Display number in layout
        if (this.layoutRenderer) {
            this.layoutRenderer.displayNumber(currentNumber);
        }
        
        // Initialize drawing for this number
        if (this.drawingRenderer) {
            this.drawingRenderer.initializeForNumber(currentNumber);
        }
        
        // Play instruction
        this.playNumberInstruction(currentNumber);
    }
    
    /**
     * Play instruction for current number (2nd question onwards only)
     */
    playNumberInstruction(number) {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        // Only play for 2nd question onwards
        if (this.numbersCompleted === 0) {
            console.log(`🔇 Skipping instruction for first number ${number} - using GAME_START instead`);
            return;
        }
        
        setTimeout(() => {
            const message = DRAW_CONFIG.AUDIO.QUESTION_START.DRAW_NUMBER(number);
            this.speakText(message);
        }, 500);
    }
    
    /**
     * Enhanced number completion with immediate rainbow integration
     */
    onNumberComplete(number) {
        if (this.isProcessingCompletion) {
            console.log('⏳ Already processing completion, ignoring duplicate');
            return;
        }
        
        this.isProcessingCompletion = true;
        console.log(`🎉 Number ${number} completed! Adding rainbow piece immediately.`);
        
        // Immediate rainbow piece addition
        if (this.rainbow && typeof this.rainbow.addPiece === 'function') {
            try {
                const pieces = this.rainbow.addPiece();
                console.log(`🌈 Rainbow piece added successfully: ${pieces}/${DRAW_CONFIG.RAINBOW_PIECES}`);
            } catch (error) {
                console.error('❌ Rainbow addPiece failed:', error);
            }
        }
        
        // Play completion audio
        this.playCompletionAudio(number);
        
        // Update counters
        this.numbersCompleted++;
        this.currentNumberIndex++;
        
        // Check if game is complete
        if (this.rainbow && typeof this.rainbow.isComplete === 'function' && this.rainbow.isComplete()) {
            console.log('🏆 Rainbow reports completion, finishing game');
            setTimeout(() => {
                this.completeGame();
            }, 3000);
        } else {
            // Move to next number
            setTimeout(() => {
                this.isProcessingCompletion = false;
                this.startNextNumber();
            }, DRAW_CONFIG.TIMING.TOTAL_COMPLETION_DELAY);
        }
    }
    
    /**
     * Play completion audio for a number
     */
    playCompletionAudio(number) {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        const encouragement = DRAW_CONFIG.getRandomEncouragement();
        this.speakText(encouragement);
    }
    
    /**
     * Complete the entire game
     */
    completeGame() {
        if (this.gameComplete) return;
        
        console.log('🏆 Game completed! All numbers drawn!');
        
        this.gameComplete = true;
        this.isProcessingCompletion = false;
        
        // Show completion modal
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
        
        // Start bear celebration
        if (this.bear && typeof this.bear.startCelebration === 'function') {
            try {
                this.bear.startCelebration();
                console.log('🐻 Bear celebration started');
            } catch (error) {
                console.error('❌ Bear celebration failed:', error);
            }
        }
        
        // Play completion audio
        this.playGameCompletionAudio();
    }
    
    /**
     * Play game completion audio
     */
    playGameCompletionAudio() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            this.speakText(DRAW_CONFIG.AUDIO.GAME_END.ALL_COMPLETE);
        }, 1000);
    }
    
    /**
     * Handle play again button
     */
    handlePlayAgain() {
        console.log('🔄 Play again requested');
        
        // Stop bear celebration
        if (this.bear && typeof this.bear.stopCelebration === 'function') {
            this.bear.stopCelebration();
        }
        
        // Clear renderers
        if (this.drawingRenderer) {
            this.drawingRenderer.clear();
        }
        
        if (this.layoutRenderer) {
            this.layoutRenderer.clear();
        }
        
        // Start new game
        this.startGame();
    }
    
    /**
     * NEW: Handle flooding warning from interaction handler
     */
    handleFloodingWarning() {
        console.log('🚨 Handling flooding warning from interaction handler');
        
        // Play immediate warning audio
        if (window.AudioSystem) {
            window.AudioSystem.speakText(DRAW_CONFIG.AUDIO.FLOODING.TOO_MUCH_DRAWING);
        }
        
        // Start reset button flashing
        this.startResetButtonFlashing();
    }
    
    /**
     * NEW: Play second flooding warning (called after delay)
     */
    playSecondFloodingWarning() {
        console.log('🔊 Playing second flooding warning');
        
        if (window.AudioSystem) {
            window.AudioSystem.speakText(DRAW_CONFIG.AUDIO.FLOODING.PRESS_RESET_BUTTON);
        }
    }
    
    /**
     * NEW: Start reset button flashing animation (orange, 1Hz)
     */
    startResetButtonFlashing() {
        if (this.resetButtonFlashing) return;
        
        this.resetButtonFlashing = true;
        console.log('🔄 Starting reset button flashing');
        
        const redoButton = document.getElementById('redoButton');
        if (!redoButton) {
            console.warn('⚠️ Redo button not found for flashing');
            return;
        }
        
        // Store original styles and functionality
        if (!redoButton.dataset.originalBackground) {
            redoButton.dataset.originalBackground = redoButton.style.background || DRAW_CONFIG.LINE_LENGTH_FLOODING.NORMAL_COLOR;
        }
        
        // Change button functionality to full reset during flooding
        this.overrideResetButtonBehavior(redoButton);
        
        // Start flashing animation
        let flashOn = true;
        this.flashInterval = setInterval(() => {
            if (!this.resetButtonFlashing) {
                clearInterval(this.flashInterval);
                return;
            }
            
            if (flashOn) {
                // Flash to orange
                redoButton.style.background = DRAW_CONFIG.LINE_LENGTH_FLOODING.FLASH_COLOR;
                redoButton.style.transform = redoButton.style.transform.replace(/scale\([^)]*\)/g, '') + ' scale(1.1)';
            } else {
                // Return to normal (but still slightly highlighted)
                redoButton.style.background = DRAW_CONFIG.LINE_LENGTH_FLOODING.FLASH_COLOR.replace('0.9', '0.7');
                redoButton.style.transform = redoButton.style.transform.replace(/scale\([^)]*\)/g, '') + ' scale(1.0)';
            }
            flashOn = !flashOn;
        }, DRAW_CONFIG.LINE_LENGTH_FLOODING.FLASH_INTERVAL);
    }
    
    /**
     * NEW: Stop reset button flashing and restore normal appearance
     */
    stopResetButtonFlashing() {
        if (!this.resetButtonFlashing) return;
        
        this.resetButtonFlashing = false;
        console.log('🔄 Stopping reset button flashing');
        
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
        
        const redoButton = document.getElementById('redoButton');
        if (redoButton) {
            // Restore original appearance
            redoButton.style.background = redoButton.dataset.originalBackground || DRAW_CONFIG.LINE_LENGTH_FLOODING.NORMAL_COLOR;
            redoButton.style.transform = redoButton.style.transform.replace(/scale\([^)]*\)/g, '');
            
            // Restore original button functionality
            this.restoreResetButtonBehavior(redoButton);
        }
    }
    
    /**
     * NEW: Override reset button to clear all drawing during flooding
     */
    overrideResetButtonBehavior(redoButton) {
        // Store original event listeners if not already stored
        if (!redoButton.dataset.originalListenersStored) {
            redoButton.dataset.originalListenersStored = 'true';
            
            // Clone button to remove all existing event listeners
            const newButton = redoButton.cloneNode(true);
            redoButton.parentNode.replaceChild(newButton, redoButton);
            
            // Update reference
            const updatedButton = document.getElementById('redoButton');
            
            // Add new full-reset functionality
            const fullResetHandler = (e) => {
                e.preventDefault();
                console.log('🧹 Full reset triggered by orange button');
                this.performFullReset();
            };
            
            updatedButton.addEventListener('click', fullResetHandler);
            updatedButton.addEventListener('touchend', fullResetHandler);
            
            // Store handler reference for cleanup
            updatedButton.fullResetHandler = fullResetHandler;
        }
    }
    
    /**
     * NEW: Restore reset button to normal undo functionality
     */
    restoreResetButtonBehavior(redoButton) {
        if (redoButton.dataset.originalListenersStored === 'true') {
            redoButton.dataset.originalListenersStored = 'false';
            
            // Clone button to remove flood-reset listeners
            const newButton = redoButton.cloneNode(true);
            redoButton.parentNode.replaceChild(newButton, redoButton);
            
            // Get updated reference and restore normal undo functionality
            const updatedButton = document.getElementById('redoButton');
            
            // Add normal undo functionality back
            const undoHandler = (e) => {
                e.preventDefault();
                if (window.drawingRenderer && typeof window.drawingRenderer.undoLastStroke === 'function') {
                    window.drawingRenderer.undoLastStroke();
                }
            };
            
            updatedButton.addEventListener('click', undoHandler);
            updatedButton.addEventListener('touchend', undoHandler);
            
            console.log('🔄 Reset button functionality restored to normal undo');
        }
    }
    
    /**
     * NEW: Perform full reset of all drawing
     */
    performFullReset() {
        console.log('🧹 Performing full drawing reset');
        
        // Call the interaction handler's reset canvas method directly
        if (this.drawingRenderer && 
            this.drawingRenderer.interactionHandler && 
            typeof this.drawingRenderer.interactionHandler.resetCanvas === 'function') {
            
            this.drawingRenderer.interactionHandler.resetCanvas();
            console.log('✅ Full reset completed via interaction handler');
        } else {
            // Fallback: clear through drawing renderer
            if (this.drawingRenderer && typeof this.drawingRenderer.clear === 'function') {
                this.drawingRenderer.clear();
                console.log('✅ Full reset completed via drawing renderer');
            } else {
                console.warn('⚠️ No reset method available');
            }
        }
        
        // Stop the flashing since user has responded
        this.stopResetButtonFlashing();
    }
    
    /**
     * Speak text using audio system
     */
    speakText(text, options = {}) {
        if (!this.audioEnabled || !this.isTabVisible || !window.AudioSystem) {
            console.log(`🔇 Speech blocked: ${text.substring(0, 30)}...`);
            return;
        }
        
        const defaultOptions = {
            rate: 0.9,
            pitch: 1.3,
            volume: 0.8
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        console.log(`🗣️ Speaking: ${text}`);
        window.AudioSystem.speakText(text, finalOptions);
    }
    
    /**
     * Get current game progress
     */
    getGameProgress() {
        return {
            currentNumberIndex: this.currentNumberIndex,
            currentNumber: this.numbersSequence[this.currentNumberIndex],
            numbersCompleted: this.numbersCompleted,
            totalNumbers: this.numbersSequence.length,
            gameComplete: this.gameComplete,
            rainbowPieces: this.rainbow ? (this.rainbow.getPieces ? this.rainbow.getPieces() : 0) : 0,
            drawingProgress: this.drawingRenderer ? this.drawingRenderer.getProgress() : null,
            resetButtonFlashing: this.resetButtonFlashing
        };
    }
    
    /**
     * Handle page unload cleanup
     */
    cleanup() {
        console.log('🧹 Cleaning up game controller');
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.playAgainBtn) {
            this.playAgainBtn.removeEventListener('click', this.handlePlayAgain);
        }
        
        // Stop button flashing
        this.stopResetButtonFlashing();
        
        // Destroy renderers
        if (this.drawingRenderer) {
            this.drawingRenderer.destroy();
        }
        
        if (this.layoutRenderer) {
            this.layoutRenderer.destroy();
        }
        
        // Stop celebrations
        if (this.bear && typeof this.bear.reset === 'function') {
            this.bear.reset();
        }
        
        if (this.rainbow && typeof this.rainbow.reset === 'function') {
            this.rainbow.reset();
        }
        
        // Stop any audio
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clear global references
        window.drawingRenderer = null;
        window.drawGameController = null;
        
        console.log('✅ Game controller cleanup complete');
    }
    
    /**
     * Debug method to skip to specific number
     */
    skipToNumber(number) {
        if (!DRAW_CONFIG.DEBUG_MODE) {
            console.log('🚫 Debug mode not enabled');
            return;
        }
        
        const index = this.numbersSequence.indexOf(number);
        if (index === -1) {
            console.log(`🚫 Number ${number} not found in sequence`);
            return;
        }
        
        console.log(`⏭️ Skipping to number ${number}`);
        
        this.currentNumberIndex = index;
        this.numbersCompleted = index;
        
        // Update rainbow to match progress
        if (this.rainbow) {
            this.rainbow.reset();
            for (let i = 0; i < index; i++) {
                this.rainbow.addPiece();
            }
        }
        
        this.startNextNumber();
    }
    
    /**
     * Debug method to complete current number
     */
    forceComplete() {
        if (!DRAW_CONFIG.DEBUG_MODE) {
            console.log('🚫 Debug mode not enabled');
            return;
        }
        
        const currentNumber = this.numbersSequence[this.currentNumberIndex];
        console.log(`⚡ Force completing number ${currentNumber}`);
        
        this.onNumberComplete(currentNumber);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, initializing Draw Game Controller');
    
    // Create global game instance
    window.drawGame = new DrawGameController();
    
    // Setup debug keyboard shortcuts if debug mode enabled
    if (DRAW_CONFIG.DEBUG_MODE) {
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                window.drawGame.forceComplete();
            }
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                window.drawGame.skipToNumber(parseInt(e.key));
            }
            if (e.key === 'r') {
                e.preventDefault();
                window.drawGame.handlePlayAgain();
            }
        });
        
        console.log('🐛 Debug mode enabled - Spacebar: force complete, 0-9: skip to number, R: restart');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.drawGame) {
        window.drawGame.cleanup();
    }
});

console.log('🎮 DrawGameController class defined with complete UI management');
