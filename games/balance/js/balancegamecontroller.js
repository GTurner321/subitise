/**
 * BalanceGameController - Main game logic and coordination
 * UPDATED: Triggers success glow on balance achievement, updated level progression
 */
class BalanceGameController {
    constructor() {
        this.svg = null;
        this.renderer = null;
        this.physics = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentLevel = 0; // Start at level 0
        this.currentQuestion = 1;
        this.consecutiveCorrect = 0;
        this.consecutiveSlow = 0;
        this.questionStartTime = 0;
        this.questionMoves = 0;
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
        console.log('Audio system ready');
    }
    
    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        // Note: Resize is now handled by ResponsiveManager
    }
    
    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('id', 'balanceSVG');
        this.svg.setAttribute('class', 'balance-svg');
        this.svg.setAttribute('width', window.innerWidth);
        this.svg.setAttribute('height', window.innerHeight);
        
        this.container.appendChild(this.svg);
        
        // Initialize renderer with new component architecture
        this.renderer = new BalanceGameRenderer(this.svg, this);
        
        // Initialize physics
        this.physics = new BalancePhysics();
        
        // Start animation loop
        this.startAnimationLoop();
        
        console.log('Game initialized with new component architecture');
    }
    
    startAnimationLoop() {
        const animate = (currentTime) => {
            // Initialize lastUpdateTime on first call
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
                
                // Check for equilibrium with equal weights
                if (this.gameActive && state.isBalanced && weights.left === weights.right && weights.left > 0) {
                    this.completeQuestion();
                }
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    startNewGame() {
        this.currentLevel = 0; // Start at level 0
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
        this.questionMoves = 0; // Track moves for this question
        
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
            this.renderer.createFixedBlockInPan(questionData.leftBlock, 'left');
        }
        if (questionData.rightBlock) {
            this.renderer.createFixedBlockInPan(questionData.rightBlock, 'right');
        }
        
        // Create ground blocks
        this.createGroundBlocks(questionData.groundBlocks);
        
        // Set initial physics state
        const initialWeights = this.renderer.getWeights();
        const initialWeightDiff = Math.abs(initialWeights.right - initialWeights.left);
        
        // Tell physics what the starting weight difference is
        this.physics.setInitialWeightDifference(initialWeightDiff);
        
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
        
        if (this.currentLevel === 0 || this.currentLevel === 1) {
            // Level 0 & 1: One block on left, empty right
            const target = level.targetRange.min + 
                Math.floor(Math.random() * (level.targetRange.max - level.targetRange.min + 1));
            result.leftBlock = target;
            
            // Generate ground blocks from distribution
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
            
            // Generate ground blocks from distribution
            result.groundBlocks = this.generateGroundBlocksForTarget(Math.abs(target - other), level);
        }
        
        return result;
    }
    
    generateGroundBlocksForTarget(target, level) {
        // Use the fixed block distribution from level config
        const blocks = [];
        
        // Add all blocks according to blockDistribution
        if (level.blockDistribution) {
            Object.entries(level.blockDistribution).forEach(([value, count]) => {
                for (let i = 0; i < count; i++) {
                    blocks.push(parseInt(value));
                }
            });
        } else {
            // Fallback to old method if blockDistribution not defined
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
            
            // Add random extras to reach 12
            const targetTotal = 12;
            const blocksNeeded = targetTotal - blocks.length;
            for (let i = 0; i < blocksNeeded; i++) {
                blocks.push(available[Math.floor(Math.random() * available.length)]);
            }
        }
        
        console.log(`Generated ${blocks.length} blocks for level ${this.currentLevel}:`, blocks);
        
        return shuffleArray(blocks);
    }
    
    createGroundBlocks(values) {
        console.log('Creating ground blocks, count:', values.length, 'values:', values);
        
        // Use the global function from balanceconfig.js
        const positions = generateGroundBlockPositions(values.length);
        console.log('Generated positions:', positions.length);
        
        // Ensure we have enough colors by cycling through them if needed
        const colorPool = [...BALANCE_CONFIG.BLOCK_COLORS];
        
        values.forEach((value, index) => {
            const pos = positions[index];
            if (!pos) {
                console.warn('Missing position for block', index);
                return;
            }
            
            // Cycle through colors if we run out
            const colorIndex = index % colorPool.length;
            const color = colorPool[colorIndex];
            
            const block = this.renderer.createBlock(value, pos.x, pos.y, color, false);
            this.svg.appendChild(block);
            this.renderer.blocks.push(block);
            
            console.log(`Created block ${index + 1}/${values.length}: value=${value}, pos=(${pos.x}, ${pos.y}), color=${color}`);
        });
        
        console.log(`Total blocks created: ${this.renderer.blocks.length}`);
    }
    
    onBlockMoved() {
        // Called when a block is moved (from renderer)
        // Track moves for level progression
        this.questionMoves++;
        
        // Physics will handle balance checking
        // Just play sound feedback
        if (window.AudioSystem) {
            window.AudioSystem.playTone(440, 0.1, 'sine', 0.1);
        }
    }
    
    completeQuestion() {
        this.gameActive = false;
        
        console.log('Question completed - weights are equal!');
        
        // TRIGGER SUCCESS GLOW on seesaw elements (replaces green flash)
        if (this.renderer && this.renderer.elementManager) {
            this.renderer.elementManager.flashBalanceSuccess();
        }
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Play success sound
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
        
        // UPDATED: Delay speech to allow glow to be visible
        setTimeout(() => {
            this.speakText('Well done! Balanced!');
        }, 1000);
        
        // Check level progression BEFORE incrementing question
        this.checkLevelProgression();
        
        // UPDATED: Delay fade out by 2 seconds to let glow complete (was immediate)
        setTimeout(() => {
            this.fadeOutSeesaw();
        }, 2000);
        
        // Check if game complete
        if (this.currentQuestion >= BALANCE_CONFIG.TOTAL_QUESTIONS) {
            // UPDATED: Total delay now 6 seconds (2s glow + 4s fade)
            setTimeout(() => {
                this.endGame();
            }, 6000);
        } else {
            this.currentQuestion++;
            // UPDATED: Total delay now 5 seconds (2s glow + 3s fade)
            setTimeout(() => {
                this.fadeInNewQuestion();
            }, 5000);
        }
    }
    
    checkLevelProgression() {
        const level = BALANCE_CONFIG.LEVELS[this.currentLevel];
        
        // Calculate time taken for this question
        const timeTaken = Date.now() - this.questionStartTime;
        
        console.log(`Question completed in ${this.questionMoves} moves, ${(timeTaken/1000).toFixed(1)}s`);
        
        // UPDATED: Check if completed within time limit (now 30 seconds)
        const completedInTime = timeTaken <= level.questionTime;
        
        // Track consecutive performance
        if (completedInTime) {
            this.consecutiveCorrect++;
            this.consecutiveSlow = 0;
            console.log(`✅ Consecutive correct: ${this.consecutiveCorrect}/${level.consecutiveForPromotion} (fast completion)`);
        } else {
            this.consecutiveSlow++;
            this.consecutiveCorrect = 0;
            console.log(`⏰ Consecutive slow: ${this.consecutiveSlow}/${level.consecutiveForDemotion} (slow completion)`);
        }
        
        // UPDATED: Check for promotion (now requires 2 correct, was 3)
        if (this.consecutiveCorrect >= level.consecutiveForPromotion && this.currentLevel < 3) {
            this.currentLevel++;
            this.consecutiveCorrect = 0;
            console.log(`🎉 PROMOTED to level ${this.currentLevel}!`);
            setTimeout(() => {
                this.speakText(`Well done! Moving to level ${this.currentLevel}`);
            }, 1500);
        }
        // Check for demotion (move to easier level)
        else if (this.consecutiveSlow >= level.consecutiveForDemotion && this.currentLevel > 0) {
            this.currentLevel--;
            this.consecutiveSlow = 0;
            console.log(`📉 Demoted to level ${this.currentLevel}`);
            setTimeout(() => {
                this.speakText(`Let's try an easier level`);
            }, 1500);
        }
    }
    
    fadeOutSeesaw() {
        // Fade out all game elements
        if (this.container) {
            this.container.style.transition = 'opacity 1s ease-out';
            this.container.style.opacity = '0';
        }
    }
    
    fadeInNewQuestion() {
        // Reset opacity to 0 before starting new question
        if (this.container) {
            this.container.style.opacity = '0';
        }
        
        // Start new question
        this.startNewQuestion();
        
        // Fade in after brief delay
        setTimeout(() => {
            if (this.container) {
                this.container.style.transition = 'opacity 1s ease-in';
                this.container.style.opacity = '1';
            }
        }, 100);
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
