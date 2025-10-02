/**
 * BalanceGameController - Main game logic and coordination
 * FIXED: Remove teddy celebration, proper block clearing, maintain physics on tab switch
 */
class BalanceGameController {
    constructor() {
        this.svg = null;
        this.renderer = null;
        this.physics = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.consecutiveCorrect = 0;
        this.consecutiveSlow = 0;
        this.questionStartTime = 0;
        this.gameActive = false;
        
        // DOM elements
        this.container = document.getElementById('balanceContainer');
        this.modal = document.getElementById('gameModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Animation
        this.animationId = null;
        this.lastUpdateTime = 0;
        
        this.init();
    }
    
    async init() {
        await this.initializeAudio();
        this.setupEventListeners();
        this.createSVG();
        this.startNewGame();
    }
    
    async initializeAudio() {
        // Audio system already initialized globally
    }
    
    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('id', 'balanceSVG');
        this.svg.setAttribute('class', 'balance-svg');
        this.svg.setAttribute('width', window.innerWidth);
        this.svg.setAttribute('height', window.innerHeight);
        
        this.container.appendChild(this.svg);
        
        // Initialize systems
        this.renderer = new BalanceRenderer(this.svg, this);
        this.physics = new BalancePhysics();
        
        // Start animation loop
        this.startAnimationLoop();
    }
    
    startAnimationLoop() {
        const animate = (currentTime) => {
            // Don't reset lastUpdateTime on first call or after tab switch
            if (!this.lastUpdateTime) {
                this.lastUpdateTime = currentTime;
            }
            
            const deltaTime = currentTime - this.lastUpdateTime;
            this.lastUpdateTime = currentTime;
            
            // Update physics (continue even when not active to maintain state)
            if (this.physics && this.renderer) {
                const weights = this.renderer.getWeights();
                this.physics.updateWeights(weights.left, weights.right);
                
                const groundHit = this.renderer.lastGroundHit || false;
                const state = this.physics.update(deltaTime, groundHit);
                
                const hitGround = this.renderer.updateSeesawRotation(state.angle);
                this.renderer.lastGroundHit = hitGround;
                
                // Only check for balance completion when game is active
                if (state.isBalanced && this.gameActive) {
                    this.completeQuestion();
                }
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    startNewGame() {
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.consecutiveCorrect = 0;
        this.consecutiveSlow = 0;
        this.gameActive = false;
        
        if (this.modal) this.modal.classList.add('hidden');
        
        this.rainbow.reset();
        this.bear.reset();
        
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        this.gameActive = true;
        this.questionStartTime = Date.now();
        
        console.log(`Starting question ${this.currentQuestion}, level ${this.currentLevel}`);
        
        // Clear ALL previous blocks (including grey fixed blocks)
        this.renderer.clearMoveableBlocks();
        
        // Create seesaw if not exists
        if (!this.renderer.seesawGroup) {
            this.renderer.createSeesaw();
        }
        
        // Reset physics
        this.physics.reset();
        
        // Generate question
        const questionData = this.generateQuestion();
        
        // Create fixed grey blocks in pans (centered at bottom)
        if (questionData.leftBlock) {
            this.createFixedBlock(questionData.leftBlock, 'left');
        }
        if (questionData.rightBlock) {
            this.createFixedBlock(questionData.rightBlock, 'right');
        }
        
        // Create ground blocks
        this.createGroundBlocks(questionData.groundBlocks);
        
        // Set initial physics state
        const initialWeights = this.renderer.getWeights();
        this.physics.updateWeights(initialWeights.left, initialWeights.right);
        const targetAngle = this.physics.targetAngle;
        this.physics.setAngle(targetAngle);
        this.renderer.updateSeesawRotation(targetAngle);
        
        // Give audio instruction
        setTimeout(() => {
            this.speakText(`Balance the seesaw using the blocks on the ground`);
        }, 1000);
    }
    
    generateQuestion() {
        const level = BALANCE_CONFIG.LEVELS[this.currentLevel];
        const result = {
            leftBlock: null,
            rightBlock: null,
            groundBlocks: []
        };
        
        if (this.currentLevel === 1) {
            // Level 1: One block on left, empty right
            const target = level.targetRange.min + 
                Math.floor(Math.random() * (level.targetRange.max - level.targetRange.min + 1));
            result.leftBlock = target;
            
            // Generate ground blocks to make target
            result.groundBlocks = this.generateGroundBlocksForTarget(target, level);
            
        } else {
            // Level 2 & 3: Blocks on both sides
            const target = level.targetRange.min + 
                Math.floor(Math.random() * (level.targetRange.max - level.targetRange.min + 1));
            
            let other;
            do {
                other = level.otherSideRange.min + 
                    Math.floor(Math.random() * (level.otherSideRange.max - level.otherSideRange.min + 1));
            } while (Math.abs(target - other) < level.minDifference);
            
            result.leftBlock = target;
            result.rightBlock = other;
            
            // Need to balance: add (target - other) to right side
            const needed = Math.abs(target - other);
            result.groundBlocks = this.generateGroundBlocksForTarget(needed, level);
        }
        
        return result;
    }
    
    generateGroundBlocksForTarget(target, level) {
        const blocks = [];
        const available = [...level.availableBlocks];
        
        // Generate exact blocks needed
        let remaining = target;
        while (remaining > 0) {
            const validBlocks = available.filter(b => b <= remaining);
            if (validBlocks.length === 0) break;
            
            const block = validBlocks[Math.floor(Math.random() * validBlocks.length)];
            blocks.push(block);
            remaining -= block;
        }
        
        // Add extra blocks
        Object.entries(level.extraBlocks).forEach(([value, count]) => {
            for (let i = 0; i < count; i++) {
                blocks.push(parseInt(value));
            }
        });
        
        // Add some random extras
        const extraCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < extraCount; i++) {
            blocks.push(available[Math.floor(Math.random() * available.length)]);
        }
        
        return shuffleArray(blocks);
    }
    
    createFixedBlock(value, side) {
        const pan = side === 'left' ? this.renderer.leftPan : this.renderer.rightPan;
        const blockDims = getBlockDimensions();
        
        // Create block at center of pan bottom (local coordinates)
        // Pan bottom line is at local y = -extensionHeight
        // Place block CENTER at that line so block sits ON the pan
        const localX = 0; // Centered horizontally
        const localY = -pan.extensionHeight; // Center at pan bottom line
        
        const block = this.renderer.createBlock(
            value,
            0, // Will be positioned in local coordinates
            0,
            BALANCE_CONFIG.FIXED_BLOCK_COLOR,
            true
        );
        
        // Add to pan
        pan.blocks.push(block);
        block._inPan = pan;
        
        // Store local coordinates
        block.setAttribute('data-local-x', localX);
        block.setAttribute('data-local-y', localY);
        
        // Update block position in local coordinates
        this.renderer.updateBlockInPan(block, pan, localX, localY);
        
        // Add to pan group
        pan.group.appendChild(block);
    }
    
    createGroundBlocks(values) {
        // Use the global function from balanceconfig.js
        const positions = window.generateGroundBlockPositions 
            ? window.generateGroundBlockPositions(values.length)
            : generateGroundBlockPositions(values.length);
            
        const colors = [...BALANCE_CONFIG.BLOCK_COLORS];
        
        values.forEach((value, index) => {
            const pos = positions[index];
            if (!pos) {
                console.warn('Missing position for block', index);
                return;
            }
            
            const colorIndex = Math.floor(Math.random() * colors.length);
            const color = colors.splice(colorIndex, 1)[0];
            
            const block = this.renderer.createBlock(value, pos.x, pos.y, color, false);
            this.svg.appendChild(block);
            this.renderer.blocks.push(block);
        });
    }
    
    onBlockMoved() {
        // Physics will handle balance checking
        // Just play sound feedback
        if (window.AudioSystem) {
            window.AudioSystem.playTone(440, 0.1, 'sine', 0.1);
        }
    }
    
    completeQuestion() {
        this.gameActive = false;
        
        const questionTime = Date.now() - this.questionStartTime;
        const level = BALANCE_CONFIG.LEVELS[this.currentLevel];
        
        console.log(`Question completed in ${questionTime}ms`);
        
        // Check timing for level progression
        if (questionTime <= level.questionTime) {
            this.consecutiveCorrect++;
            this.consecutiveSlow = 0;
            
            if (this.consecutiveCorrect >= level.consecutiveForPromotion && this.currentLevel < 3) {
                this.currentLevel++;
                this.consecutiveCorrect = 0;
                console.log(`Promoted to level ${this.currentLevel}`);
            }
        } else {
            this.consecutiveSlow++;
            this.consecutiveCorrect = 0;
            
            if (this.consecutiveSlow >= level.consecutiveForDemotion && this.currentLevel > 1) {
                this.currentLevel--;
                this.consecutiveSlow = 0;
                console.log(`Demoted to level ${this.currentLevel}`);
            }
        }
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // NO TEDDY - removed
        
        // Play success sound
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
        
        setTimeout(() => {
            this.speakText('Well done! Balanced!');
        }, 500);
        
        // Check if game complete
        if (this.currentQuestion >= BALANCE_CONFIG.TOTAL_QUESTIONS) {
            setTimeout(() => {
                this.endGame();
            }, 3000);
        } else {
            this.currentQuestion++;
            setTimeout(() => {
                this.startNewQuestion();
            }, 3000);
        }
    }
    
    endGame() {
        console.log('Game complete!');
        
        // Complete rainbow
        while (this.rainbow.getPieces() < BALANCE_CONFIG.RAINBOW_PIECES) {
            this.rainbow.addPiece();
        }
        
        // Show modal
        setTimeout(() => {
            this.showCompletionModal();
        }, 2000);
    }
    
    showCompletionModal() {
        if (this.modal && this.modalTitle) {
            this.modalTitle.textContent = '🌈 Well Done! 🌈';
            this.modal.classList.remove('hidden');
            
            setTimeout(() => {
                this.bear.startCelebration();
            }, 500);
            
            setTimeout(() => {
                this.speakText('Well done! You balanced all the seesaws!');
            }, 1000);
        }
    }
    
    speakText(text) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text);
        }
    }
    
    handleResize() {
        if (this.svg) {
            this.svg.setAttribute('width', window.innerWidth);
            this.svg.setAttribute('height', window.innerHeight);
        }
    }
    
    destroy() {
        this.gameActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        if ('speechSynthesis' in window) speechSynthesis.cancel();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.balanceGame = new BalanceGameController();
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (window.balanceGame) {
        window.balanceGame.destroy();
    }
});
