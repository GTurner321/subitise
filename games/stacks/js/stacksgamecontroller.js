class StacksGameController {
    constructor() {
        // Make config available globally for shared Rainbow and Bear classes
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
        
        // Game positioning state
        this.currentTowerBasePosition = null;
        this.existingGroundBlocks = [];
        
        // Audio
        this.audioContext = null;
        this.audioEnabled = STACKS_CONFIG.AUDIO_ENABLED;
        this.muteButton = null;
        this.muteContainer = null;
        
        // DOM elements
        this.container = document.getElementById('stacksContainer');
        this.modal = document.getElementById('gameModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.removeGameInfoElements();
        this.createMuteButton();
        this.createBackButton();
        this.setupEventListeners();
        this.createSVG();
        this.startNewQuestion();
    }
    
    removeGameInfoElements() {
        const elementsToRemove = [
            'levelInfo', 'questionInfo', 'movesInfo', 'game-info-container', 'gameInfoContainer'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log('Removing game info element:', id);
                element.remove();
            }
        });
        
        const classesToRemove = [
            'game-info-container', 'level-info', 'question-info', 'moves-info'
        ];
        
        classesToRemove.forEach(className => {
            const elements = document.getElementsByClassName(className);
            Array.from(elements).forEach(element => {
                console.log('Removing game info element by class:', className);
                element.remove();
            });
        });
        
        console.log('Game info elements cleanup complete');
    }
    
    async initializeAudio() {
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioEnabled = false;
        }
    }
    
    createMuteButton() {
        const muteContainer = document.createElement('div');
        muteContainer.className = 'mute-container';
        
        this.muteButton = document.createElement('button');
        this.muteButton.className = 'mute-button';
        
        this.updateMuteButtonIcon();
        
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        muteContainer.appendChild(this.muteButton);
        document.body.appendChild(muteContainer);
        this.muteContainer = muteContainer;
    }
    
    createBackButton() {
        const backButton = document.createElement('a');
        backButton.href = '../../index.html';
        backButton.className = 'back-button';
        
        backButton.innerHTML = `
            <i class="fas fa-arrow-left"></i>
            Back to Games
        `;
        
        document.body.appendChild(backButton);
        this.backButton = backButton;
    }
    
    updateMuteButtonIcon() {
        if (this.muteButton) {
            this.muteButton.innerHTML = this.audioEnabled ? '🔊' : '🔇';
            this.muteButton.title = this.audioEnabled ? 'Mute Audio' : 'Unmute Audio';
        }
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Audio enabled');
            }, 100);
        }
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
        this.renderer = new StacksRenderer(this.svg, this);
        
        console.log('SVG created and renderer initialized:', this.svg, this.renderer);
    }
    
    updateSVGDimensions() {
        if (this.svg) {
            const gameWidth = window.innerWidth;
            const gameHeight = window.innerHeight;
            
            this.svg.removeAttribute('viewBox');
            this.svg.setAttribute('width', gameWidth);
            this.svg.setAttribute('height', gameHeight);
            
            console.log('SVG updated to 1:1 pixel coordinates:', gameWidth, 'x', gameHeight);
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
        // Reset game state
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.totalMoves = 0;
        this.questionMoves = 0;
        this.completedTowers = [];
        this.existingGroundBlocks = [];
        this.currentTowerBasePosition = null;
        
        // Hide modal
        if (this.modal) this.modal.classList.add('hidden');
        
        // Reset rainbow and bear
        this.rainbow.reset();
        this.bear.reset();
        
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        this.gameActive = true;
        this.questionMoves = 0;
        
        console.log('Starting new question:', this.currentQuestion);
        
        // Clear only NEW tower elements (preserve completed towers)
        if (this.renderer) {
            this.renderer.clearNewTowerElements();
        }
        
        // Reset ground blocks for new question
        this.existingGroundBlocks = [];
        
        // Generate numbers for current level and question
        const blockCount = this.currentQuestion + 1;
        const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
        const numbers = levelConfig.generateNumbers(blockCount);
        
        console.log('Generated numbers:', numbers, 'for level:', this.currentLevel, 'question:', this.currentQuestion);
        
        if (!numbers) {
            console.error('Failed to generate numbers for level', this.currentLevel, 'question', this.currentQuestion);
            return;
        }
        
        // Create blocks with random colors
        const blocks = this.createGameBlocks(numbers, levelConfig.useWideBlocks);
        
        // Create containers
        const containers = [];
        for (let i = 0; i < blockCount; i++) {
            containers.push({ index: i });
        }
        
        // Calculate all positions using game controller logic
        const towerCenterX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const baseY = STACKS_CONFIG.TOWER_BASE_Y_PERCENT;
        
        // Calculate container positions
        const containerPositions = this.calculateContainerPositions(blockCount, towerCenterX, baseY);
        this.currentTowerBasePosition = containerPositions[0]; // Store base position
        
        // Calculate block positions with proper exclusions
        const blockPositions = this.calculateInitialBlockPositions(blocks.length, towerCenterX);
        
        // Render the tower using calculated positions
        this.renderer.renderTowerWithPositions(
            blocks, 
            containers, 
            containerPositions,
            blockPositions,
            levelConfig.useWideBlocks
        );
        
        console.log('Tower rendered with calculated positions');
        
        // Give audio instruction
        if (this.audioEnabled) {
            setTimeout(() => {
                const sortedNumbers = [...numbers].sort((a, b) => a - b);
                this.speakText(`Build a tower with ${sortedNumbers.join(', ')} from bottom to top`);
            }, 1000);
        }
    }
    
    // GAME LOGIC: Calculate container positions
    calculateContainerPositions(containerCount, centerXPercent, baseYPercent) {
        const positions = [];
        const blockHeightPercent = STACKS_CONFIG.BLOCK_HEIGHT_PERCENT;
        
        for (let i = 0; i < containerCount; i++) {
            let yPercent;
            if (i === 0) {
                // Bottom container in stable back position
                yPercent = this.getRandomGroundY();
            } else {
                // Stack above previous containers
                yPercent = positions[0].y - (i * blockHeightPercent);
            }
            
            // IMPORTANT: Ensure containers stay well within viewport bounds
            // More conservative bounds to ensure 4th+ containers are accessible
            const minY = 15; // Increased from 10 to give more room
            const maxY = 80; // Decreased from 85 to prevent going off-screen
            yPercent = Math.max(minY, Math.min(yPercent, maxY));
            
            // ADDITIONAL: For higher containers, ensure they're not too high
            if (i >= 3) { // 4th container and beyond
                const maxHighContainerY = 25; // Don't let high containers go above 25%
                yPercent = Math.max(maxHighContainerY, yPercent);
            }
            
            positions.push({
                x: centerXPercent,
                y: yPercent,
                index: i
            });
            
            console.log(`Container ${i} position calculated: ${centerXPercent}%, ${yPercent}% (bounded for accessibility)`);
        }
        
        return positions;
    }
    
    // GAME LOGIC: Calculate initial block positions with exclusions
    calculateInitialBlockPositions(blockCount, towerCenterX) {
        const positions = [];
        
        for (let i = 0; i < blockCount; i++) {
            const position = this.generateRandomGroundPositionWithExclusion(
                this.existingGroundBlocks, 
                towerCenterX, 
                this.currentTowerBasePosition,
                true // isInitialPlacement
            );
            
            positions.push(position);
            
            // Add to existing blocks for next iteration
            this.existingGroundBlocks.push(position);
            
            console.log(`Block ${i} position calculated:`, position.x + '%,', position.y + '%');
        }
        
        return positions;
    }
    
    // GAME LOGIC: Generate random ground position with exclusions - UPDATED with front exclusion
    generateRandomGroundPositionWithExclusion(existingBlocks = [], towerCenterX, baseContainerPos, isInitialPlacement = false) {
        const centerX = towerCenterX || STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const exclusionZone = STACKS_CONFIG.GROUND_EXCLUSION_ZONE_PERCENT;
        const frontExclusionZone = STACKS_CONFIG.FRONT_EXCLUSION_ZONE_PERCENT;
        const spread = STACKS_CONFIG.GROUND_SPREAD_PERCENT;
        const blockWidth = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
        
        // FIXED: Proper overlap calculation - 75% minimum distance (25% max overlap)
        const minDistance = blockWidth * 0.75;
        
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        const grassHeight = grassBottom - grassTop;
        const grassMidpoint = grassTop + (grassHeight * 0.5); // 50% down grass area
        
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            let x;
            let validX = false;
            let xAttempts = 0;
            
            // Find valid X position avoiding tower, front area, and existing blocks
            while (!validX && xAttempts < 50) {
                xAttempts++;
                x = (50 - spread/2) + Math.random() * spread;
                
                // Check tower exclusion (sides and back)
                if (Math.abs(x - centerX) < exclusionZone) {
                    continue;
                }
                
                // NEW: Check front exclusion zone (prevent blocks in front of tower)
                if (baseContainerPos) {
                    const frontY = baseContainerPos.y; // Base container Y position
                    const currentGrassY = grassTop + (grassHeight * 0.5); // Middle of grass for comparison
                    
                    // If we're in front of tower area (closer to viewer), exclude this X position
                    if (Math.abs(x - centerX) < frontExclusionZone) {
                        continue;
                    }
                }
                
                // Check base container exclusion
                if (baseContainerPos && Math.abs(x - centerX) < (exclusionZone * 0.7)) {
                    continue;
                }
                
                // FIXED: Check horizontal overlap with existing blocks (25% max overlap)
                let hasInvalidOverlap = false;
                for (let block of existingBlocks) {
                    const distance = Math.abs(x - block.x);
                    if (distance < minDistance) {
                        hasInvalidOverlap = true;
                        break;
                    }
                }
                
                if (!hasInvalidOverlap) {
                    validX = true;
                }
            }
            
            if (!validX) {
                console.log('Could not find valid X position after', xAttempts, 'attempts');
                continue;
            }
            
            // Calculate Y position with proper randomized heights and perspective layering
            let y;
            
            if (isInitialPlacement) {
                // INITIAL PLACEMENT: Random height in TOP 50% of grass area with variance
                const topHalfHeight = grassHeight * 0.5;
                const baseY = grassTop + Math.random() * topHalfHeight;
                
                // Apply height variance for randomization
                const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT;
                y = baseY + (Math.random() - 0.5) * variance * 2;
                
                // Ensure it stays within top 50% of grass
                y = Math.max(grassTop, Math.min(y, grassMidpoint));
                
                // Check for overlapping blocks and apply perspective rule
                let frontmostOverlappingBlock = null;
                for (let block of existingBlocks) {
                    const distance = Math.abs(x - block.x);
                    if (distance < minDistance) {
                        if (!frontmostOverlappingBlock || block.y > frontmostOverlappingBlock.y) {
                            frontmostOverlappingBlock = block;
                        }
                    }
                }
                
                if (frontmostOverlappingBlock) {
                    // PERSPECTIVE RULE: Place this block IN FRONT (higher Y) of overlapping block
                    const overlapY = frontmostOverlappingBlock.y;
                    const maxFrontY = grassMidpoint;
                    
                    if (overlapY >= maxFrontY) {
                        y = maxFrontY;
                    } else {
                        y = overlapY + Math.random() * (maxFrontY - overlapY);
                    }
                    
                    console.log(`Block overlaps with block at ${overlapY.toFixed(1)}%, placing IN FRONT at ${y.toFixed(1)}%`);
                }
                
            } else {
                // Non-initial placement
                const baseY = grassTop + (grassHeight * 0.2);
                const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5;
                y = baseY + (Math.random() - 0.5) * variance * 2;
                y = Math.max(grassTop, Math.min(y, grassMidpoint * 0.8));
            }
            
            console.log(`Generated valid position with exclusions after ${attempts} attempts: ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
            return { x, y };
        }
        
        // Fallback - place on side opposite to tower, away from front
        console.warn('Could not find suitable position after', maxAttempts, 'attempts, using fallback');
        const fallbackX = centerX > 50 ? 20 : 80; // Far sides
        const fallbackY = grassTop + (grassHeight * 0.3) + Math.random() * (grassHeight * 0.2);
        return { x: fallbackX, y: fallbackY };
    }
    
    // GAME LOGIC: Calculate close-to-tower position for displaced blocks
    calculateCloseToTowerPosition() {
        const towerCenterX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const displacementRange = 20;
        
        const leftBound = Math.max(5, towerCenterX - displacementRange);
        const rightBound = Math.min(95, towerCenterX + displacementRange);
        
        const x = leftBound + Math.random() * (rightBound - leftBound);
        
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
        const y = grassTop + Math.random() * (grassHeight * 0.5);
        
        console.log('Generated close-to-tower position:', x.toFixed(1) + '%,', y.toFixed(1) + '%');
        return { x, y };
    }
    
    // GAME LOGIC: Calculate displacement position
    calculateDisplacementPosition(excludeBlock = null) {
        // Get current ground blocks excluding the one being displaced
        const currentGroundBlocks = this.getExistingGroundPositions(excludeBlock);
        
        // Get position close to tower
        const groundPos = this.calculateCloseToTowerPosition();
        
        // Apply perspective layering
        const adjustedY = this.getRandomGroundYWithPerspective(currentGroundBlocks, groundPos.x);
        
        console.log('Calculated displacement position:', groundPos.x + '%,', adjustedY + '%');
        return { x: groundPos.x, y: adjustedY };
    }
    
    // GAME LOGIC: Get existing ground block positions
    getExistingGroundPositions(excludeBlock = null) {
        if (!this.renderer) return [];
        
        const groundBlocks = this.renderer.getGroundBlocks();
        const positions = [];
        
        groundBlocks.forEach(block => {
            if (block !== excludeBlock) {
                positions.push({
                    x: block._xPercent || pxToVw(block._centerX),
                    y: block._yPercent || pxToVh(block._centerY)
                });
            }
        });
        
        console.log('Found', positions.length, 'existing ground block positions');
        return positions;
    }
    
    // GAME LOGIC: Calculate Y position with perspective
    getRandomGroundYWithPerspective(existingBlocks = [], targetX = null) {
        if (!targetX || existingBlocks.length === 0) {
            const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
            const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
            const baseY = grassTop + (grassHeight * 0.2);
            const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5;
            return baseY + (Math.random() - 0.5) * variance * 2;
        }
        
        const blockWidth = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
        const minDistance = blockWidth * 0.75;
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        const grassHeight = grassBottom - grassTop;
        const grassMidpoint = grassTop + (grassHeight * 0.5);
        
        let overlappingBlock = null;
        for (let block of existingBlocks) {
            const distance = Math.abs(targetX - block.x);
            if (distance < minDistance) {
                if (!overlappingBlock || block.y > overlappingBlock.y) {
                    overlappingBlock = block;
                }
            }
        }
        
        if (overlappingBlock) {
            const minY = overlappingBlock.y;
            const maxY = grassMidpoint;
            return minY >= maxY ? maxY : minY + Math.random() * (maxY - minY);
        } else {
            const baseY = grassTop + (grassHeight * 0.2);
            const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5;
            return baseY + (Math.random() - 0.5) * variance * 2;
        }
    }
    
    // GAME LOGIC: Get random ground Y for containers - FIXED to place base in lower grass area
    getRandomGroundY() {
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        const grassHeight = grassBottom - grassTop;
        
        // FIXED: Place base containers in 25-50% down the grass area for proper grounding
        const minPosition = 0.25; // 25% down grass
        const maxPosition = 0.50; // 50% down grass
        const randomPosition = minPosition + Math.random() * (maxPosition - minPosition);
        
        return grassTop + (grassHeight * randomPosition);
    }
    
    createGameBlocks(numbers, useWideBlocks = false) {
        const blocks = [];
        const usedColors = new Set();
        
        numbers.forEach(number => {
            let color;
            do {
                color = STACKS_CONFIG.BLOCK_COLORS[Math.floor(Math.random() * STACKS_CONFIG.BLOCK_COLORS.length)];
            } while (usedColors.has(color) && usedColors.size < STACKS_CONFIG.BLOCK_COLORS.length);
            
            usedColors.add(color);
            
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
        
        // Check if tower is complete and correct
        if (this.renderer.isValidTowerOrder()) {
            this.completeQuestion();
        }
    }
    
    completeQuestion() {
        this.gameActive = false;
        
        // Visual feedback
        this.renderer.highlightCorrectOrder();
        
        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Add teddy to top of tower
        const teddyImageUrl = STACKS_CONFIG.TEDDY_IMAGES[this.currentQuestion - 1];
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
        
        // Audio feedback
        if (this.audioEnabled) {
            this.playSuccessSound();
            setTimeout(() => {
                this.speakText('Well done! Tower complete!');
            }, 500);
        }
        
        // Move tower to side after delay
        setTimeout(() => {
            this.moveTowerToSide();
        }, STACKS_CONFIG.TOWER_MOVE_DELAY);
    }
    
    moveTowerToSide() {
        const towerBlocks = this.renderer.getTowerBlocks();
        const teddy = this.currentTeddy;
        
        // Determine which side this tower goes to
        const isLeftSide = this.currentQuestion % 2 === 1;
        
        console.log('Moving tower', this.currentQuestion, 'to', isLeftSide ? 'left' : 'right', 'side');
        
        // Calculate target position based on existing completed towers
        let targetXPercent;
        
        if (isLeftSide) {
            const leftTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 1);
            if (leftTowers.length === 0) {
                targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_LEFT_X_PERCENT;
            } else {
                const lastLeftPosition = Math.max(...leftTowers.map(tower => tower.position));
                targetXPercent = lastLeftPosition + STACKS_CONFIG.COMPLETED_TOWER_SPACING_PERCENT;
            }
        } else {
            const rightTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 0);
            if (rightTowers.length === 0) {
                targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_RIGHT_X_PERCENT;
            } else {
                const lastRightPosition = Math.min(...rightTowers.map(tower => tower.position));
                targetXPercent = lastRightPosition - STACKS_CONFIG.COMPLETED_TOWER_SPACING_PERCENT;
            }
        }
        
        targetXPercent = Math.max(5, Math.min(95, targetXPercent));
        
        console.log('Calculated target position:', targetXPercent + '%', 'for tower', this.currentQuestion);
        
        // Animate tower to new position
        this.renderer.animateCompletedTower(towerBlocks, teddy, targetXPercent, () => {
            this.completedTowers.push({
                blocks: towerBlocks,
                teddy: teddy,
                position: targetXPercent,
                question: this.currentQuestion,
                side: isLeftSide ? 'left' : 'right'
            });
            
            console.log('Tower', this.currentQuestion, 'stored at position:', targetXPercent + '%');
            
            // Check level progression
            this.checkLevelProgression();
            
            // Start next question or end game
            if (this.currentQuestion < STACKS_CONFIG.TOTAL_QUESTIONS) {
                this.currentQuestion++;
                setTimeout(() => {
                    this.startNewQuestion();
                }, 1000);
            } else {
                this.endGame();
            }
        });
    }
    
    checkLevelProgression() {
        const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
        const maxAllowedMoves = levelConfig.moveThreshold * (this.currentQuestion + 1);
        
        if (this.questionMoves > maxAllowedMoves) {
            if (this.currentLevel > 1) {
                const nextQuestionMoves = this.getNextQuestionEstimate();
                if (nextQuestionMoves > maxAllowedMoves) {
                    this.currentLevel = Math.max(1, this.currentLevel - 1);
                    console.log('Dropped to level', this.currentLevel);
                }
            }
        } else {
            // UPDATED: Max level is now 6 instead of 8
            if (this.currentLevel < 6) {
                this.currentLevel++;
                console.log('Advanced to level', this.currentLevel);
            }
        }
    }
    
    getNextQuestionEstimate() {
        return this.questionMoves;
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
            this.modalTitle.textContent = '🌈 Amazing Work! 🌈';
            this.modalMessage.textContent = `You've built all ${STACKS_CONFIG.TOTAL_QUESTIONS} towers with ${this.totalMoves} total moves!`;
            
            this.modal.style.background = 'transparent';
            this.modal.classList.remove('hidden');
            
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText('Amazing work! You have completed all the towers!');
                }, 500);
            }
            
            setTimeout(() => {
                this.bear.startCelebration();
            }, 1000);
        }
    }
    
    // Audio feedback methods
    playDragStartSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            // Silent failure
        }
    }
    
    playDropSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (error) {
            // Silent failure
        }
    }
    
    playReturnSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (error) {
            // Silent failure
        }
    }
    
    playSuccessSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            // Silent failure
        }
    }
    
    speakText(text) {
        if (!this.audioEnabled) return;
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                const voices = speechSynthesis.getVoices();
                let selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('boy') ||
                    voice.name.toLowerCase().includes('man') ||
                    (!voice.name.toLowerCase().includes('female') && 
                     !voice.name.toLowerCase().includes('woman') &&
                     !voice.name.toLowerCase().includes('girl'))
                );
                
                if (selectedVoice) utterance.voice = selectedVoice;
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            // Silent failure
        }
    }
    
    destroy() {
        this.gameActive = false;
        
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up renderer
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (this.audioContext) this.audioContext.close();
        
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
        
        if (this.backButton && this.backButton.parentNode) {
            this.backButton.parentNode.removeChild(this.backButton);
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
