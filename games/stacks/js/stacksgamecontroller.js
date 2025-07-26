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
        
        // SIMPLIFIED: Track existing block positions for non-overlap placement
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
        // Reset game state
        this.currentLevel = 1;
        this.currentQuestion = 1;
        this.totalMoves = 0;
        this.questionMoves = 0;
        this.completedTowers = [];
        this.existingGroundBlocks = [];
        
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
        
        // SIMPLIFIED: Calculate positions using new logic
        const containerPositions = this.calculateContainerPositions(blockCount);
        const blockPositions = this.calculateSimplifiedBlockPositions(blocks.length);
        
        // Render the tower using calculated positions
        this.renderer.renderTowerWithPositions(
            blocks, 
            containers, 
            containerPositions,
            blockPositions,
            levelConfig.useWideBlocks
        );
        
        console.log('Tower rendered with simplified positioning');
        
        // Give audio instruction
        if (this.audioEnabled) {
            setTimeout(() => {
                const sortedNumbers = [...numbers].sort((a, b) => a - b);
                this.speakText(`Build a tower with ${sortedNumbers.join(', ')} from bottom to top`);
            }, 1000);
        }
    }
    
    // SIMPLIFIED: Calculate container positions with proper grass positioning
    calculateContainerPositions(containerCount) {
        const positions = [];
        const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT_PERCENT;
        
        // Base container at grass level
        const baseY = getContainerGroundY();
        
        for (let i = 0; i < containerCount; i++) {
            let yPercent;
            if (i === 0) {
                // Bottom container at grass level
                yPercent = baseY;
            } else {
                // Stack above previous containers
                yPercent = baseY - (i * blockHeight);
            }
            
            // Ensure containers stay within reasonable bounds
            yPercent = Math.max(10, Math.min(yPercent, 85));
            
            positions.push({
                x: centerX,
                y: yPercent,
                index: i
            });
            
            console.log(`Container ${i} position: ${centerX}%, ${yPercent}%`);
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
        
        // Determine which side this tower goes to (alternating left/right)
        const isLeftSide = this.currentQuestion % 2 === 1;
        
        console.log('Moving tower', this.currentQuestion, 'to', isLeftSide ? 'left' : 'right', 'side');
        
        // FIXED: Calculate target position with proper spacing (one block width apart)
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
                question: this.currentQuestion,
                side: isLeftSide ? 'left' : 'right'
            });
            
            console.log('Tower', this.currentQuestion, 'stored at position:', targetXPercent + '%');
            
            // FIXED: Check if this is the 6th tower (all towers complete)
            if (this.currentQuestion === 6) {
                // Restore all towers to full opacity
                this.restoreAllTowersOpacity();
                
                // Complete the rainbow (add remaining pieces to total 10)
                this.completeRainbow();
                
                // Start end sequence
                setTimeout(() => {
                    this.endGame();
                }, 2000);
            } else {
                // Check level progression
                this.checkLevelProgression();
                
                // Start next question
                this.currentQuestion++;
                setTimeout(() => {
                    this.startNewQuestion();
                }, 1000);
            }
        });
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
            this.modalTitle.textContent = '🌈 Amazing Work! 🌈';
            this.modalMessage.textContent = `You've built all ${STACKS_CONFIG.TOTAL_QUESTIONS} towers with ${this.totalMoves} total moves!`;
            
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
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            // Silent failure
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
