/**
 * Draw Game Controller - Enhanced with Fixed Rainbow Integration
 * 
 * PURPOSE: Coordinates all game systems and manages game flow
 * - Fixed rainbow visibility issues with proper timing and initialization
 * - Simplified component loading with better error handling
 * - Enhanced completion detection with immediate feedback
 * - Proper game area coordination with ButtonBar system
 * - Manages game progression through all 10 numbers (0-9)
 * - Handles game state, completion detection, and user feedback
 * - Coordinates audio announcements and visual celebrations
 * - Manages game restart and cleanup functionality
 */

class DrawGameController {
    constructor() {
        console.log('🎮 DrawGameController initializing with enhanced rainbow integration');
        
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
        
        // NEW: Initialization flags
        this.componentsReady = false;
        this.gameAreaReady = false;
        this.rainbowReady = false;
        
        // Bind methods for event handlers
        this.onNumberComplete = this.onNumberComplete.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePlayAgain = this.handlePlayAgain.bind(this);
        
        // Initialize game
        this.initializeGame();
    }
    
    /**
     * Initialize all game systems with improved sequencing
     */
    async initializeGame() {
        console.log('🚀 Starting enhanced game initialization sequence');
        
        try {
            // Step 1: Wait for DOM
            await this.waitForDOM();
            console.log('✅ DOM ready');
            
            // Step 2: Initialize audio system
            this.initializeAudioSystem();
            console.log('✅ Audio system ready');
            
            // Step 3: Setup visibility handling
            this.setupVisibilityHandling();
            console.log('✅ Visibility handling ready');
            
            // Step 4: Setup modal and UI (early)
            this.setupGameUI();
            console.log('✅ Game UI ready');
            
            // Step 5: Wait for ButtonBar to create game area
            await this.waitForGameAreaReady();
            console.log('✅ Game area ready');
            
            // Step 6: Initialize shared components AFTER game area is ready
            await this.initializeSharedComponents();
            console.log('✅ Shared components ready');
            
            // Step 7: Initialize renderers
            await this.initializeRenderers();
            console.log('✅ Renderers ready');
            
            // Step 8: Final verification and start
            if (this.verifyAllSystemsReady()) {
                this.startGame();
                console.log('✅ Game initialization complete and game started');
            } else {
                throw new Error('System verification failed');
            }
            
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
     * NEW: Wait for game area to be properly set up by ButtonBar
     */
    waitForGameAreaReady() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            const checkGameArea = () => {
                attempts++;
                
                const gameArea = document.querySelector('.game-area');
                const rainbowContainer = document.getElementById('rainbowContainer');
                
                if (gameArea && rainbowContainer) {
                    // Check if game area has proper dimensions
                    const rect = gameArea.getBoundingClientRect();
                    if (rect.width > 100 && rect.height > 100) {
                        console.log(`🎯 Game area ready: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}px`);
                        this.gameAreaReady = true;
                        resolve();
                        return;
                    }
                }
                
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Game area setup timeout, proceeding anyway');
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
        console.log('🌈 Initializing shared components after game area setup');
        
        // Initialize Rainbow with proper error handling
        try {
            // Check multiple possible locations for Rainbow
            let RainbowClass = null;
            
            if (window.Rainbow && typeof window.Rainbow === 'function') {
                RainbowClass = window.Rainbow;
                console.log('📍 Found Rainbow at window.Rainbow');
            } else if (typeof Rainbow !== 'undefined' && typeof Rainbow === 'function') {
                RainbowClass = Rainbow;
                window.Rainbow = Rainbow; // Ensure it's on window
                console.log('📍 Found Rainbow in global scope, added to window');
            }
            
            if (RainbowClass) {
                this.rainbow = new RainbowClass();
                this.rainbowReady = true;
                console.log('✅ Rainbow initialized successfully');
                
                // Verify rainbow container is properly positioned
                setTimeout(() => {
                    if (this.rainbow && typeof this.rainbow.initializeArcs === 'function') {
                        console.log('🔄 Re-initializing rainbow arcs after component setup');
                        this.rainbow.initializeArcs();
                    }
                }, 500);
            } else {
                console.warn('⚠️ Rainbow class not found, creating dummy implementation');
                this.rainbow = this.createDummyRainbow();
            }
        } catch (error) {
            console.error('❌ Rainbow initialization failed:', error);
            this.rainbow = this.createDummyRainbow();
        }
        
        // Initialize Bear with proper error handling
        try {
            let BearClass = null;
            
            if (window.Bear && typeof window.Bear === 'function') {
                BearClass = window.Bear;
                console.log('📍 Found Bear at window.Bear');
            } else if (typeof Bear !== 'undefined' && typeof Bear === 'function') {
                BearClass = Bear;
                window.Bear = Bear; // Ensure it's on window
                console.log('📍 Found Bear in global scope, added to window');
            }
            
            if (BearClass) {
                this.bear = new BearClass();
                console.log('✅ Bear initialized successfully');
            } else {
                console.warn('⚠️ Bear class not found, creating dummy implementation');
                this.bear = this.createDummyBear();
            }
        } catch (error) {
            console.error('❌ Bear initialization failed:', error);
            this.bear = this.createDummyBear();
        }
        
        this.componentsReady = true;
        console.log('✅ All shared components initialized');
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
     * NEW: Verify all systems are ready before starting
     */
    verifyAllSystemsReady() {
        const checks = {
            config: typeof DRAW_CONFIG !== 'undefined',
            gameArea: this.gameAreaReady,
            components: this.componentsReady,
            layoutRenderer: this.layoutRenderer && this.layoutRenderer.isLayoutReady(),
            drawingRenderer: !!this.drawingRenderer,
            rainbow: !!this.rainbow,
            bear: !!this.bear,
            modal: !!this.modal
        };
        
        console.log('🔍 System verification:', checks);
        
        const allReady = Object.values(checks).every(check => check === true);
        
        if (!allReady) {
            const failures = Object.entries(checks)
                .filter(([key, value]) => !value)
                .map(([key]) => key);
            console.error('❌ System verification failed:', failures);
        }
        
        return allReady;
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
                // Instructions now include the first number
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
        
        // Only play for 2nd question onwards (first question uses GAME_START messages)
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
     * NEW: Enhanced number completion with immediate rainbow integration
     */
    onNumberComplete(number) {
        if (this.isProcessingCompletion) {
            console.log('⏳ Already processing completion, ignoring duplicate');
            return;
        }
        
        this.isProcessingCompletion = true;
        console.log(`🎉 Number ${number} completed! Adding rainbow piece immediately.`);
        
        // NEW: Immediate rainbow piece addition with verification
        if (this.rainbow && typeof this.rainbow.addPiece === 'function') {
            try {
                const pieces = this.rainbow.addPiece();
                console.log(`🌈 Rainbow piece added successfully: ${pieces}/${DRAW_CONFIG.RAINBOW_PIECES}`);
                
                // Verify the piece was actually added
                const currentPieces = this.rainbow.getPieces ? this.rainbow.getPieces() : pieces;
                console.log(`🌈 Rainbow verification: ${currentPieces} pieces now visible`);
                
                // Force rainbow re-initialization if needed
                if (currentPieces !== pieces && typeof this.rainbow.initializeArcs === 'function') {
                    console.log('🔄 Re-initializing rainbow arcs due to mismatch');
                    setTimeout(() => this.rainbow.initializeArcs(), 100);
                }
            } catch (error) {
                console.error('❌ Rainbow addPiece failed:', error);
            }
        } else {
            console.warn('⚠️ Rainbow not available or addPiece method missing');
        }
        
        // Play completion audio
        this.playCompletionAudio(number);
        
        // Update counters
        this.numbersCompleted++;
        this.currentNumberIndex++;
        
        // Check if game is complete
        if (this.rainbow && typeof this.rainbow.isComplete === 'function' && this.rainbow.isComplete()) {
            console.log('🏆 Rainbow reports completion, finishing game');
            // Delay game completion to allow rainbow celebration
            setTimeout(() => {
                this.completeGame();
            }, 3000);
        } else {
            // Move to next number after total completion delay
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
        
        // Play random encouragement
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
            systemsReady: {
                gameArea: this.gameAreaReady,
                components: this.componentsReady,
                rainbow: this.rainbowReady
            }
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

console.log('🎮 DrawGameController class defined with enhanced rainbow integration');
