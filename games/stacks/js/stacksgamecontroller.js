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
        this.levelInfo = document.getElementById('levelInfo');
        this.questionInfo = document.getElementById('questionInfo');
        this.movesInfo = document.getElementById('movesInfo');
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.createMuteButton();
        this.setupEventListeners();
        this.createSVG();
        this.updateGameInfo();
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
        muteContainer.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 1000;
            background: rgba(0, 0, 0, 0.7); border-radius: 50%;
            width: 60px; height: 60px; display: flex;
            align-items: center; justify-content: center; cursor: pointer;
            transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        this.muteButton = document.createElement('button');
        this.muteButton.style.cssText = `
            background: none; border: none; color: white; font-size: 24px;
            cursor: pointer; width: 100%; height: 100%; display: flex;
            align-items: center; justify-content: center;
        `;
        
        this.updateMuteButtonIcon();
        
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        muteContainer.addEventListener('mouseenter', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            muteContainer.style.transform = 'scale(1.1)';
        });
        
        muteContainer.addEventListener('mouseleave', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            muteContainer.style.transform = 'scale(1)';
        });
        
        muteContainer.appendChild(this.muteButton);
        document.body.appendChild(muteContainer);
        this.muteContainer = muteContainer;
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
        
        // Initialize renderer
        this.renderer = new StacksRenderer(this.svg, this);
    }
    
    updateSVGDimensions() {
        if (this.svg) {
            const gameWidth = window.innerWidth;
            const gameHeight = window.innerHeight;
            
            this.svg.setAttribute('viewBox', `0 0 ${gameWidth} ${gameHeight}`);
            this.svg.setAttribute('width', '100%');
            this.svg.setAttribute('height', '100%');
            
            // Update config dimensions
            STACKS_CONFIG.SVG_WIDTH = gameWidth;
            STACKS_CONFIG.SVG_HEIGHT = gameHeight;
            STACKS_CONFIG.TOWER_CENTER_X = gameWidth * 0.5;
            STACKS_CONFIG.TOWER_BASE_Y = gameHeight - 100;
            STACKS_CONFIG.GROUND_Y = gameHeight - 90;
            STACKS_CONFIG.COMPLETED_TOWER_LEFT_X = gameWidth * 0.15;
            STACKS_CONFIG.COMPLETED_TOWER_RIGHT_X = gameWidth * 0.85;
        }
    }
    
    handleResize() {
        if (this.svg) {
            this.updateSVGDimensions();
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
        
        this.updateGameInfo();
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        this.gameActive = true;
        this.questionMoves = 0;
        
        // Clear SVG
        if (this.renderer) {
            this.renderer.clearTower();
        }
        
        // Generate numbers for current level and question
        const blockCount = this.currentQuestion + 1; // Question 1 = 2 blocks, etc.
        const levelConfig = STACKS_CONFIG.LEVELS[this.currentLevel];
        const numbers = levelConfig.generateNumbers(blockCount);
        
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
        
        // Render the tower
        this.renderer.renderTower(
            blocks, 
            containers, 
            STACKS_CONFIG.TOWER_CENTER_X, 
            STACKS_CONFIG.TOWER_BASE_Y,
            levelConfig.useWideBlocks
        );
        
        this.updateGameInfo();
        
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
        this.updateGameInfo();
        
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
            const teddy = this.renderer.createTeddy(
                topContainer._centerX, 
                topContainer._centerY, 
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
        
        // Determine target position (alternate left/right)
        const isLeftSide = this.currentQuestion % 2 === 1;
        const baseX = isLeftSide ? STACKS_CONFIG.COMPLETED_TOWER_LEFT_X : STACKS_CONFIG.COMPLETED_TOWER_RIGHT_X;
        const towerOffset = Math.floor((this.currentQuestion - 1) / 2) * STACKS_CONFIG.COMPLETED_TOWER_SPACING;
        const targetX = isLeftSide ? baseX + towerOffset : baseX - towerOffset;
        
        // Animate tower to new position
        this.renderer.animateCompletedTower(towerBlocks, teddy, targetX, () => {
            this.completedTowers.push({
                blocks: towerBlocks,
                teddy: teddy,
                position: targetX
            });
            
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
    
    updateGameInfo() {
        if (this.levelInfo) {
            this.levelInfo.textContent = `Level ${this.currentLevel}`;
        }
        if (this.questionInfo) {
            this.questionInfo.textContent = `Tower ${this.currentQuestion} of ${STACKS_CONFIG.TOTAL_QUESTIONS}`;
        }
        if (this.movesInfo) {
            this.movesInfo.textContent = `Moves: ${this.questionMoves}`;
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
