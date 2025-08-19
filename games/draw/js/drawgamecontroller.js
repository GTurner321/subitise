/**
 * Draw Game Controller - Main Game Orchestrator
 * 
 * PURPOSE: Coordinates all game systems and manages game flow
 * - Integrates layout renderer, drawing renderer, audio, rainbow, and bear systems
 * - Manages game progression through all 10 numbers (0-9)
 * - Handles game state, completion detection, and user feedback
 * - Coordinates audio announcements and visual celebrations
 * - Manages game restart and cleanup functionality
 */

class DrawGameController {
    constructor() {
        console.log('🎮 DrawGameController initializing - orchestrating game systems');
        
        // Game state
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        
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
        
        // Bind methods for event handlers
        this.onNumberComplete = this.onNumberComplete.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePlayAgain = this.handlePlayAgain.bind(this);
        
        // Initialize game
        this.initializeGame();
    }
    
    /**
     * Initialize all game systems
     */
    async initializeGame() {
        console.log('🚀 Starting game initialization sequence');
        
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Initialize audio system
            this.initializeAudioSystem();
            
            // Setup visibility handling
            this.setupVisibilityHandling();
            
            // Initialize shared components
            this.initializeSharedComponents();
            
            // Setup modal and UI
            this.setupGameUI();
            
            // Initialize renderers
            await this.initializeRenderers();
            
            // Start first number
            this.startGame();
            
            console.log('✅ Game initialization complete');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
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
     * Initialize audio system
     */
    initializeAudioSystem() {
        console.log('🔊 Initializing audio system');
        
        // Audio system should already be initialized globally
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
            // Stop any ongoing audio when tab is hidden
            if (window.AudioSystem) {
                window.AudioSystem.stopAllAudio();
            }
        }
        
        console.log(`👁️ Tab visibility: ${this.isTabVisible ? 'visible' : 'hidden'}`);
    }
    
    /**
     * Initialize shared components (Rainbow, Bear)
     */
    initializeSharedComponents() {
        console.log('🌈 Initializing shared components');
        
        // Initialize Rainbow
        if (window.Rainbow) {
            this.rainbow = new window.Rainbow();
            console.log('✅ Rainbow initialized');
        } else {
            console.warn('⚠️ Rainbow component not available');
        }
        
        // Initialize Bear
        if (window.Bear) {
            this.bear = new window.Bear();
            console.log('✅ Bear initialized');
        } else {
            console.warn('⚠️ Bear component not available');
        }
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
        }
        
        if (this.bear) {
            this.bear.reset();
        }
        
        // Hide modal
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
        // Start first number
        this.startNextNumber();
        
        // Play welcome message
        this.playWelcomeMessage();
    }
    
    /**
     * Play welcome message
     */
    playWelcomeMessage() {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            this.speakText(DRAW_CONFIG.AUDIO.GAME_START.WELCOME);
            
            setTimeout(() => {
                this.speakText(DRAW_CONFIG.AUDIO.GAME_START.INSTRUCTIONS);
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
     * Play instruction for current number
     */
    playNumberInstruction(number) {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        setTimeout(() => {
            let message;
            
            if (this.numbersCompleted === 0) {
                // First number
                message = DRAW_CONFIG.AUDIO.QUESTION_START.DRAW_NUMBER(number);
            } else {
                // Subsequent numbers
                message = DRAW_CONFIG.AUDIO.QUESTION_START.DRAW_NUMBER(number);
            }
            
            this.speakText(message);
        }, 500);
    }
    
    /**
     * Handle number completion (called by DrawingRenderer)
     */
    onNumberComplete(number) {
        if (this.isProcessingCompletion) {
            console.log('⏳ Already processing completion, ignoring duplicate');
            return;
        }
        
        this.isProcessingCompletion = true;
        console.log(`🎉 Number ${number} completed!`);
        
        // Add rainbow piece
        if (this.rainbow) {
            this.rainbow.addPiece();
        }
        
        // Play completion audio
        this.playCompletionAudio(number);
        
        // Play completion sound effect
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
        
        // Update counters
        this.numbersCompleted++;
        this.currentNumberIndex++;
        
        // Check if game is complete
        if (this.rainbow && this.rainbow.isComplete()) {
            // Delay game completion to allow rainbow celebration
            setTimeout(() => {
                this.completeGame();
            }, 3000);
        } else {
            // Move to next number after delay
            setTimeout(() => {
                this.isProcessingCompletion = false;
                this.startNextNumber();
            }, DRAW_CONFIG.TIMING.COMPLETION_DELAY);
        }
    }
    
    /**
     * Play completion audio for a number
     */
    playCompletionAudio(number) {
        if (!this.audioEnabled || !this.isTabVisible) return;
        
        // Play random encouragement
        const encouragement = DRAW_CONFIG.getRandomEncouragement();
        this.speakText(encouragement);
        
        // Follow with specific number completion message
        setTimeout(() => {
            const message = DRAW_CONFIG.AUDIO.COMPLETION.NUMBER_COMPLETE(number);
            this.speakText(message);
        }, 1500);
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
        if (this.bear) {
            this.bear.startCelebration();
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
            
            setTimeout(() => {
                this.speakText(DRAW_CONFIG.AUDIO.GAME_END.CELEBRATION);
            }, 3000);
        }, 1000);
    }
    
    /**
     * Handle play again button
     */
    handlePlayAgain() {
        console.log('🔄 Play again requested');
        
        // Stop bear celebration
        if (this.bear) {
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
            rainbowPieces: this.rainbow ? this.rainbow.getPieces() : 0,
            drawingProgress: this.drawingRenderer ? this.drawingRenderer.getProgress() : null
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
        
        // Destroy renderers
        if (this.drawingRenderer) {
            this.drawingRenderer.destroy();
        }
        
        if (this.layoutRenderer) {
            this.layoutRenderer.destroy();
        }
        
        // Stop celebrations
        if (this.bear) {
            this.bear.reset();
        }
        
        if (this.rainbow) {
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

console.log('🎮 DrawGameController class defined and ready');
