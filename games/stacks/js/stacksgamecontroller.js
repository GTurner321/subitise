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
        // Removed game info elements as they're no longer needed
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.createMuteButton();
        this.createBackButton(); // Add back button
        this.setupEventListeners();
        this.createSVG();
        this.startNewQuestion();
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
            
            // IMPORTANT: Remove viewBox to use 1:1 pixel coordinate system
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
        
        // Generate numbers for current level and question
        const blockCount = this.currentQuestion + 1; // Question 1 = 2 blocks, etc.
        const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
        const numbers = levelConfig.generateNumbers(blockCount);
        
        console.log('Generated numbers:', numbers, 'for level:', this.currentLevel, 'question:', this.currentQuestion);
        
        if (!numbers) {
            console.error('Failed to generate numbers for level', this.currentLevel, 'question', this.currentQuestion);
            return;
        }
        
        // Create blocks with random colors
        const blocks = this.createGameBlocks(numbers, levelConfig.useWideBlocks);
        
        console.log('Created blocks:', blocks);
        
        // Create containers
        const containers = [];
        for (let i = 0; i < blockCount; i++) {
            containers.push({ index: i });
        }
        
        // Render the tower using PERCENTAGE-based coordinates
        this.renderer.renderTower(
            blocks, 
            containers, 
            STACKS_CONFIG.TOWER_CENTER_X_PERCENT,  // Use percentage value
            STACKS_CONFIG.TOWER_BASE_Y_PERCENT,    // Use percentage value
            levelConfig.useWideBlocks
        );
        
        console.log('Tower rendered');
        // Removed updateGameInfo() call
        
        // Give audio instruction
        if (this.audioEnabled) {
            setTimeout(() => {
                const sortedNumbers = [...numbers].sort((a, b) => a - b);
                this.speakText(`Build a tower with ${sortedNumbers.join(', ')} from bottom to top`);
            }, 1000);
        }
    }
    
    createGameBlocks(numbers, useWideBlocks = false) {
        const blocks = [];
        const usedColors = new Set();
        
        numbers.forEach(number => {
            // Pick a random color that hasn't been used
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
        // Removed updateGameInfo() call since info box is removed
        
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
            .sort((a, b) => parseFloat(a.getAttribute('y')) - parseFloat(b.getAttribute('y')))[0]; // Top container
        
        if (topContainer) {
            // Convert pixel position back to percentage for teddy creation
            const teddyXPercent = pxToVw(topContainer._centerX);
            const teddyYPercent = pxToVh(topContainer._centerY);
            
            const teddy = this.renderer.createTeddy(
                teddyXPercent, 
                teddyYPercent, 
                teddyImageUrl
            );
            this.svg.appendChild(teddy);
            
            // Store reference for animation
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
            // Find the rightmost (furthest) left-side tower position
            const leftTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 1);
            if (leftTowers.length === 0) {
                // First left tower
                targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_LEFT_X_PERCENT;
            } else {
                // Place next to the previous left tower
                const lastLeftPosition = Math.max(...leftTowers.map(tower => tower.position));
                targetXPercent = lastLeftPosition + STACKS_CONFIG.COMPLETED_TOWER_SPACING_PERCENT;
            }
        } else {
            // Find the leftmost (furthest) right-side tower position  
            const rightTowers = this.completedTowers.filter((_, index) => (index + 1) % 2 === 0);
            if (rightTowers.length === 0) {
                // First right tower
                targetXPercent = STACKS_CONFIG.COMPLETED_TOWER_RIGHT_X_PERCENT;
            } else {
                // Place next to the previous right tower
                const lastRightPosition = Math.min(...rightTowers.map(tower => tower.position));
                targetXPercent = lastRightPosition - STACKS_CONFIG.COMPLETED_TOWER_SPACING_PERCENT;
            }
        }
        
        // Ensure we don't go off screen
        targetXPercent = Math.max(5, Math.min(95, targetXPercent));
        
        console.log('Calculated target position:', targetXPercent + '%', 'for tower', this.currentQuestion);
        console.log('Existing completed towers:', this.completedTowers.map(t => t.position));
        
        // Animate tower to new position
        this.renderer.animateCompletedTower(towerBlocks, teddy, targetXPercent, () => {
            // Store the completed tower with its FINAL position
            this.completedTowers.push({
                blocks: towerBlocks,
                teddy: teddy,
                position: targetXPercent,
                question: this.currentQuestion,
                side: isLeftSide ? 'left' : 'right'
            });
            
            console.log('Tower', this.currentQuestion, 'stored at position:', targetXPercent + '%');
            console.log('All completed towers now:', this.completedTowers.map(t => `Q${t.question}: ${t.position.toFixed(1)}%`));
            
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
            // Too many moves - check if we should drop level
            if (this.currentLevel > 1) {
                // Look ahead to next question
                const nextQuestionMoves = this.getNextQuestionEstimate();
                if (nextQuestionMoves > maxAllowedMoves) {
                    this.currentLevel = Math.max(1, this.currentLevel - 1);
                    console.log('Dropped to level', this.currentLevel);
                }
            }
        } else {
            // Good performance - can progress to next level
            if (this.currentLevel < 8) {
                this.currentLevel++;
                console.log('Advanced to level', this.currentLevel);
            }
        }
    }
    
    getNextQuestionEstimate() {
        // Simple heuristic - assume similar performance for next question
        return this.questionMoves;
    }
    
    endGame() {
        // Add final rainbow arcs to complete it
        for (let i = 0; i < STACKS_CONFIG.FINAL_RAINBOW_ARCS; i++) {
            setTimeout(() => {
                this.rainbow.addPiece();
            }, i * 300);
        }
        
        // Show completion modal after rainbow is complete
        setTimeout(() => {
            this.showCompletionModal();
        }, STACKS_CONFIG.FINAL_RAINBOW_ARCS * 300 + 1000);
    }
    
    showCompletionModal() {
        if (this.modal && this.modalTitle && this.modalMessage) {
            this.modalTitle.textContent = '🌈 Amazing Work! 🌈';
            this.modalMessage.textContent = `You've built all ${STACKS_CONFIG.TOTAL_QUESTIONS} towers with ${this.totalMoves} total moves!`;
            
            // Remove dark background by making modal background transparent
            this.modal.style.background = 'transparent';
            this.modal.classList.remove('hidden');
            
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText('Amazing work! You have completed all the towers!');
                }, 500);
            }
            
            // Start bear celebration
            setTimeout(() => {
                this.bear.startCelebration();
            }, 1000);
        }
    }
    
    // Removed updateGameInfo() method since info box is no longer needed
    
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
