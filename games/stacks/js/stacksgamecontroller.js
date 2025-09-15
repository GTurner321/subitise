class StacksGameController {
    constructor() {
        // Make config available globally
        window.CONFIG = STACKS_CONFIG;
        
        this.svg = null;
        this.renderer = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.totalMoves = 0;
        this.questionMoves = 0;
        this.gameActive = false;
        this.completedTowers = [];
        
        // NEW: Continuation game state
        this.isInContinuationMode = false;
        this.continuationQuestion = 1; // 1-4 for the 4 harder towers
        
        // SIMPLIFIED: Track existing block positions for non-overlap placement
        this.existingGroundBlocks = [];
        
        // Audio - simplified to use shared system
        this.audioReady = false;
        
        // DOM elements
        this.container = document.getElementById('stacksContainer');
        this.modal = document.getElementById('gameModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // NEW: Continuation modal elements (will be created dynamically)
        this.continuationModal = null;
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.removeGameInfoElements();
        this.setupEventListeners();
        this.createSVG();
        this.createContinuationModal(); // NEW: Create the continuation modal
        this.startNewQuestion();
    }
    
    // NEW: Create continuation modal for asking about harder towers
    createContinuationModal() {
        // Create modal HTML structure
        this.continuationModal = document.createElement('div');
        this.continuationModal.className = 'modal hidden';
        this.continuationModal.id = 'continuationModal';
        this.continuationModal.innerHTML = `
            <div class="modal-content">
                <h2 id="continuationModalTitle">🌈 Great Job! 🌈</h2>
                <p id="continuationModalMessage">Would you like to continue with 4 harder towers?</p>
                <button class="play-again-btn" id="continueBtn">
                    <i class="fas fa-arrow-right"></i>
                    CONTINUE TO 4 MORE
                </button>
            </div>
        `;
        
        document.body.appendChild(this.continuationModal);
        
        // Add event listener for continue button
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.startContinuationMode());
        }
    }
    
    removeGameInfoElements() {
        const elementsToRemove = [
            'levelInfo', 'questionInfo', 'movesInfo', 'game-info-container', 'gameInfoContainer'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
        
        const classesToRemove = [
            'game-info-container', 'level-info', 'question-info', 'moves-info'
        ];
        
        classesToRemove.forEach(className => {
            const elements = document.getElementsByClassName(className);
            Array.from(elements).forEach(element => element.remove());
        });
    }
    
    async initializeAudio() {
        // The shared AudioSystem handles audio context creation
        // Just set a flag that we're ready for audio
        this.audioReady = true;
    }
    
    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
    }
    
    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('id', 'stacksSVG');
        this.svg.setAttribute('class', 'stacks-svg');
        this.updateSVGDimensions();
        
        this.container.appendChild(this.svg);
        
        // Initialize renderer AFTER SVG is in DOM
        this.renderer = new StacksGameRenderer(this.svg, this);
        
        console.log('SVG created and renderer initialized');
    }
    
    updateSVGDimensions() {
        if (this.svg) {
            const gameWidth = window.innerWidth;
            const gameHeight = window.innerHeight;
            
            this.svg.removeAttribute('viewBox');
            this.svg.setAttribute('width', gameWidth);
            this.svg.setAttribute('height', gameHeight);
        }
    }
    
    handleResize() {
        if (this.svg) {
            this.updateSVGDimensions();
        }
        if (this.renderer) {
            this.renderer.handleResize();
        }
    }
    
    startNewGame() {
        // Reset ALL game state for completely new game
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.totalMoves = 0;
        this.questionMoves = 0;
        this.completedTowers = [];
        this.existingGroundBlocks = [];
        this.isInContinuationMode = false;
        this.continuationQuestion = 1;
        
        // Hide all modals
        if (this.modal) this.modal.classList.add('hidden');
        if (this.continuationModal) this.continuationModal.classList.add('hidden');
        
        // Reset rainbow and bear
        this.rainbow.reset();
        this.bear.reset();
        
        this.startNewQuestion();
    }
    
    // NEW: Start continuation mode with harder towers
    startContinuationMode() {
        console.log('Starting continuation mode with 4 harder towers');
        
        // Hide continuation modal
        if (this.continuationModal) {
            this.continuationModal.classList.add('hidden');
        }
        
        // Set continuation mode flags
        this.isInContinuationMode = true;
        this.continuationQuestion = 1; // Start with first harder tower (4 blocks)
        
        // Clear existing towers but keep rainbow arcs
        this.clearExistingTowers();
        
        // Reset some game state but keep rainbow progress
        this.currentQuestion = 4; // Start from tower 4 (since we're doing 4,5,6,7 block towers)
        this.totalMoves = 0;
        this.questionMoves = 0;
        this.existingGroundBlocks = [];
        
        // Start first harder tower
        this.startNewQuestion();
        
        // Give audio instruction
        setTimeout(() => {
            this.speakText('Now let\'s try some harder towers with different numbers!');
        }, 1000);
    }
    
    // NEW: Clear existing towers but preserve rainbow
    clearExistingTowers() {
        // Remove all completed tower blocks and teddies
        const completedElements = this.svg.querySelectorAll('.completed-tower');
        completedElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clear completed towers array
        this.completedTowers = [];
        
        console.log('Cleared existing towers, rainbow arcs preserved');
    }
    
    startNewQuestion() {
        this.gameActive = true;
        this.questionMoves = 0;
        
        console.log('Starting new question:', this.currentQuestion, 'Continuation mode:', this.isInContinuationMode);
        
        // Clear only NEW tower elements (preserve completed towers and rainbow)
        if (this.renderer) {
            this.renderer.clearNewTowerElements();
            console.log('Cleared previous tower elements');
        }
        
        // Reset ground blocks for new question
        this.existingGroundBlocks = [];
        
        // Check if we should stop creating new towers
        if (!this.isInContinuationMode && this.currentQuestion > 6) {
            console.log('All 6 initial towers completed, no more template towers needed');
            return;
        }
        
        if (this.isInContinuationMode && this.continuationQuestion > 4) {
            console.log('All 4 continuation towers completed');
            return;
        }
        
        // Generate numbers for current tower
        let blockCount;
        let numbers;
        let useWideBlocks = false;
        
        if (this.isInContinuationMode) {
            // Generate numbers for continuation towers (4,5,6,7 blocks)
            blockCount = 3 + this.continuationQuestion; // 4,5,6,7 blocks
            numbers = this.generateContinuationNumbers(blockCount);
            useWideBlocks = blockCount >= 6; // Use wide blocks for 6 and 7 block towers
        } else {
            // Original game logic
            blockCount = this.currentQuestion + 1;
            const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
            numbers = levelConfig.generateNumbers(blockCount);
            useWideBlocks = levelConfig.useWideBlocks;
        }
        
        console.log('Generated numbers:', numbers, 'for', blockCount, 'blocks, continuation mode:', this.isInContinuationMode);
        
        if (!numbers) {
            console.error('Failed to generate numbers');
            return;
        }
        
        // Create blocks with random colors (no repeats)
        const blocks = this.createGameBlocks(numbers, useWideBlocks);
        
        // Create containers
        const containers = [];
        for (let i = 0; i < blockCount; i++) {
            containers.push({ index: i });
        }
        
        // Calculate positions
        const containerPositions = this.calculateContainerPositions(blockCount);
        const blockPositions = this.calculateSimplifiedBlockPositions(blocks.length);
        
        // Render the tower using calculated positions
        this.renderer.renderTowerWithPositions(
            blocks, 
            containers, 
            containerPositions,
            blockPositions,
            useWideBlocks
        );
        
        console.log('New tower rendered with', containerPositions.length, 'containers and', blockPositions.length, 'blocks');
        
        // Give audio instruction using shared system
        setTimeout(() => {
            const sortedNumbers = [...numbers].sort((a, b) => a - b);
            this.speakText(`Build a tower with ${sortedNumbers.join(', ')} from bottom to top`);
        }, 1000);
    }
    
    // NEW: Generate numbers for continuation towers based on specified ranges
    generateContinuationNumbers(blockCount) {
        let min, max;
        
        switch (blockCount) {
            case 4: // 4-block tower: {1-20}
                min = 1;
                max = 20;
                break;
            case 5: // 5-block tower: {21-40}
                min = 21;
                max = 40;
                break;
            case 6: // 6-block tower: {1-100}
                min = 1;
                max = 100;
                break;
            case 7: // 7-block tower: {101-999}
                min = 101;
                max = 999;
                break;
            default:
                console.error('Invalid block count for continuation mode:', blockCount);
                return null;
        }
        
        // Generate random numbers from the range (no repeats, not necessarily consecutive)
        const availableNumbers = [];
        for (let i = min; i <= max; i++) {
            availableNumbers.push(i);
        }
        
        // Randomly select required number of unique numbers
        const selectedNumbers = [];
        for (let i = 0; i < blockCount; i++) {
            if (availableNumbers.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const selectedNumber = availableNumbers.splice(randomIndex, 1)[0];
            selectedNumbers.push(selectedNumber);
        }
        
        // Shuffle the selected numbers so they're not in order
        return this.shuffleArray([...selectedNumbers]);
    }
    
    // Shuffle array helper method
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // SIMPLIFIED: Calculate container positions with proper stacking
    calculateContainerPositions(containerCount) {
        const positions = [];
        const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT_PERCENT;
        
        console.log('Calculating positions for', containerCount, 'containers with block height:', blockHeight + '%');
        
        // FIXED: Start with base container center position (79% from top)
        const baseY = STACKS_CONFIG.TOWER_BASE_Y_PERCENT; // 79% from top
        console.log('Base container center Y position:', baseY + '% (bottom at ~83%)');
        
        for (let i = 0; i < containerCount; i++) {
            let yPercent;
            if (i === 0) {
                // Bottom container center at the base position (79%)
                yPercent = baseY;
            } else {
                // FIXED: Stack each container exactly one block height above the previous
                // Since baseY is the center, each container goes up by one block height
                yPercent = baseY - (i * blockHeight);
            }
            
            // Ensure containers stay within reasonable bounds (don't go off top of screen)
            yPercent = Math.max(10, yPercent); // Don't go above 10% from top
            
            positions.push({
                x: centerX,
                y: yPercent,
                index: i
            });
            
            console.log(`Container ${i}: center at ${yPercent}% (bottom at ~${yPercent + blockHeight/2}%)`);
        }
        
        return positions;
    }
    
    // SIMPLIFIED: Calculate block positions without complex overlap logic
    calculateSimplifiedBlockPositions(blockCount) {
        const positions = [];
        
        for (let i = 0; i < blockCount; i++) {
            const position = generateRandomGroundPosition(this.existingGroundBlocks);
            positions.push(position);
            
            // Add to existing blocks for next iteration
            this.existingGroundBlocks.push(position);
            
            console.log(`Block ${i} position: ${position.x}%, ${position.y}%`);
        }
        
        return positions;
    }
    
    createGameBlocks(numbers, useWideBlocks = false) {
        const blocks = [];
        
        // FIXED: Use brighter colors with no repeats
        const availableColors = [...STACKS_CONFIG.BLOCK_COLORS]; // Copy array
        
        numbers.forEach(number => {
            // Randomly select from remaining colors
            const colorIndex = Math.floor(Math.random() * availableColors.length);
            const color = availableColors.splice(colorIndex, 1)[0]; // Remove and use
            
            blocks.push({
                number: number,
                color: color,
                isWide: useWideBlocks
            });
        });
        
        return blocks;
    }
    
    onBlockMoved() {
        this.questionMoves++;
        this.totalMoves++;
        
        console.log('Block moved, checking tower completion...');
        
        // Check if tower is complete and correct
        if (this.renderer.isValidTowerOrder()) {
            console.log('🎉 Tower is complete and correct!');
            this.completeQuestion();
        } else {
            console.log('Tower not yet complete or incorrect order');
        }
    }
    
    completeQuestion() {
        this.gameActive = false;
        
        console.log('🎉 Question completed! Starting completion sequence...');
        
        // Visual feedback
        this.renderer.highlightCorrectOrder();
        
        // FIXED: Hide containers on completion
        this.renderer.hideCurrentTowerContainers();
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Add teddy to top of tower
        const teddyImageUrl = this.isInContinuationMode ? 
            STACKS_CONFIG.TEDDY_IMAGES[(this.continuationQuestion - 1) % STACKS_CONFIG.TEDDY_IMAGES.length] :
            STACKS_CONFIG.TEDDY_IMAGES[this.currentQuestion - 1];
            
        const topContainer = this.renderer.getAllContainers()
            .sort((a, b) => parseFloat(a.getAttribute('y')) - parseFloat(b.getAttribute('y')))[0];
        
        if (topContainer) {
            const teddyXPercent = pxToVw(topContainer._centerX);
            const teddyYPercent = pxToVh(topContainer._centerY);
            
            const teddy = this.renderer.createTeddy(
                teddyXPercent, 
                teddyYPercent, 
                teddyImageUrl
            );
            this.svg.appendChild(teddy);
            this.currentTeddy = teddy;
        }
        
        // Audio feedback using shared system
        this.playSuccessSound();
        setTimeout(() => {
            this.speakText('Well done! Tower complete!');
        }, 500);
        
        // Move tower to side after delay
        setTimeout(() => {
            this.moveTowerToSide();
        }, STACKS_CONFIG.TOWER_MOVE_DELAY);
        
        console.log('Completion sequence started, containers hidden, tower will move in', STACKS_CONFIG.TOWER_MOVE_DELAY, 'ms');
    }
    
    moveTowerToSide() {
        const towerBlocks = this.renderer.getTowerBlocks();
        const teddy = this.currentTeddy;
        
        // Determine which side this tower goes to (alternating left/right)
        let isLeftSide;
        if (this.isInContinuationMode) {
            // For continuation towers, continue the alternating pattern
            const totalTowersSoFar = 6 + this.continuationQuestion;
            isLeftSide = totalTowersSoFar % 2 === 1;
        } else {
            isLeftSide = this.currentQuestion % 2 === 1;
        }
        
        console.log('Moving tower to', isLeftSide ? 'left' : 'right', 'side');
        
        // Calculate target position with proper spacing
        let targetXPercent;
        const spacing = STACKS_CONFIG.COMPLETED_TOWER_SPACING_PERCENT;
        
        if (isLeftSide) {
            // Count existing left towers
            const leftTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 1);
            targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_LEFT_X_PERCENT + (leftTowers.length * spacing);
        } else {
            // Count existing right towers
            const rightTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 0);
            targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_RIGHT_X_PERCENT - (rightTowers.length * spacing);
        }
        
        // Ensure we don't go off screen
        targetXPercent = Math.max(5, Math.min(95, targetXPercent));
        
        console.log('Target position for tower:', targetXPercent + '%');
        
        // Animate tower to new position
        this.renderer.animateCompletedTower(towerBlocks, teddy, targetXPercent, () => {
            // Store the completed tower
            this.completedTowers.push({
                blocks: towerBlocks,
                teddy: teddy,
                position: targetXPercent,
                question: this.isInContinuationMode ? (6 + this.continuationQuestion) : this.currentQuestion,
                side: isLeftSide ? 'left' : 'right'
            });
            
            console.log('Tower stored at position:', targetXPercent + '%');
            
            // Check what to do next
            if (this.isInContinuationMode) {
                // In continuation mode - check if all 4 harder towers are done
                if (this.continuationQuestion === 4) {
                    // All towers complete! 
                    this.restoreAllTowersOpacity();
                    this.completeRainbow();
                    setTimeout(() => {
                        this.endGame();
                    }, 2000);
                } else {
                    // Move to next continuation tower
                    this.continuationQuestion++;
                    setTimeout(() => {
                        this.startNewQuestion();
                    }, 1000);
                }
            } else {
                // Original mode - check if first 6 towers are done
                if (this.currentQuestion === 6) {
                    // First 6 towers complete - show continuation modal
                    setTimeout(() => {
                        this.showContinuationModal();
                    }, 1000);
                } else {
                    // Check level progression and continue
                    this.checkLevelProgression();
                    this.currentQuestion++;
                    console.log('Starting next question:', this.currentQuestion);
                    setTimeout(() => {
                        this.startNewQuestion();
                    }, 1000);
                }
            }
        });
    }
    
    // NEW: Show continuation modal asking about harder towers
    showContinuationModal() {
        if (this.continuationModal) {
            this.continuationModal.classList.remove('hidden');
            
            // Give audio message
            setTimeout(() => {
                this.speakText('Great job! You have completed 6 towers. Would you like to continue with 4 harder towers using different numbers?');
            }, 500);
        }
    }
    
    restoreAllTowersOpacity() {
        // Restore all completed tower blocks to full opacity
        const completedBlocks = this.svg.querySelectorAll('.block.completed-tower');
        completedBlocks.forEach(block => {
            block.style.opacity = '1';
        });
        
        // Restore all completed teddies to full opacity  
        const completedTeddies = this.svg.querySelectorAll('.teddy.completed-tower');
        completedTeddies.forEach(teddy => {
            teddy.style.opacity = '1';
        });
        
        console.log('All towers restored to full opacity');
    }
    
    completeRainbow() {
        // Add remaining rainbow pieces to reach total of 10
        const currentPieces = this.rainbow.getPieces();
        const totalPieces = STACKS_CONFIG.RAINBOW_PIECES; // Should be 10
        const piecesToAdd = totalPieces - currentPieces;
        
        console.log('Adding', piecesToAdd, 'final rainbow pieces');
        
        for (let i = 0; i < piecesToAdd; i++) {
            setTimeout(() => {
                this.rainbow.addPiece();
            }, i * 200);
        }
        
        // Start rainbow end sequence after all pieces are added
        setTimeout(() => {
            if (this.rainbow.startCongratulationsSequence) {
                this.rainbow.startCongratulationsSequence();
            }
        }, piecesToAdd * 200 + 500);
    }
    
    checkLevelProgression() {
        const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
        const maxAllowedMoves = levelConfig.moveThreshold * (this.currentQuestion + 1);
        
        if (this.questionMoves > maxAllowedMoves) {
            if (this.currentLevel > 1) {
                this.currentLevel = Math.max(1, this.currentLevel - 1);
                console.log('Dropped to level', this.currentLevel);
            }
        } else {
            if (this.currentLevel < 6) {
                this.currentLevel++;
                console.log('Advanced to level', this.currentLevel);
            }
        }
    }
    
    endGame() {
        for (let i = 0; i < STACKS_CONFIG.FINAL_RAINBOW_ARCS; i++) {
            setTimeout(() => {
                this.rainbow.addPiece();
            }, i * 300);
        }
        
        setTimeout(() => {
            this.showCompletionModal();
        }, STACKS_CONFIG.FINAL_RAINBOW_ARCS * 300 + 1000);
    }
    
    showCompletionModal() {
        if (this.modal && this.modalTitle && this.modalMessage) {
            // FIXED: Use simple "Well Done!" message as requested
            this.modalTitle.textContent = '🌈 Well Done! 🌈';
                    
            this.modal.classList.remove('hidden');
            
            setTimeout(() => {
                this.speakText('Well done! You have completed all the towers! Play again or return to the home page.');
            }, 500);
            
            setTimeout(() => {
                this.bear.startCelebration();
            }, 1000);
        }
    }
    
    // Audio feedback methods - using shared AudioSystem
    playDragStartSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playTone(440, 0.1, 'sine', 0.1);
        }
    }
    
    playDropSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playTone(523.25, 0.2, 'sine', 0.2);
        }
    }
    
    playReturnSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playTone(330, 0.15, 'sine', 0.15);
        }
    }
    
    playSuccessSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
    }
    
    speakText(text) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text);
        }
    }
    
    destroy() {
        this.gameActive = false;
        
        window.removeEventListener('resize', this.handleResize);
        
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        // Stop any speech synthesis
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (this.audioContext) this.audioContext.close();
        
        // Remove continuation modal
        if (this.continuationModal && this.continuationModal.parentNode) {
            this.continuationModal.parentNode.removeChild(this.continuationModal);
        }
    }
}

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    window.stacksGame = new StacksGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.stacksGame) {
        window.stacksGame.destroy();
    }
});
