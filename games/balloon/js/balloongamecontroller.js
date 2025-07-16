class BalloonGameController {
    constructor() {
        // Make config available globally for shared Rainbow and Bear classes
        window.CONFIG = BALLOON_CONFIG;
        
        this.svg = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentLevel = 1;
        this.levelProgress = {}; // Track progress for each level
        this.usedNumbers = new Set(); // Track used numbers in current session
        this.targetNumber = null;
        this.questionCount = 0;
        
        // Balloon management
        this.balloons = [];
        this.fallingNumbers = [];
        this.balloonsSpawned = 0;
        this.animationId = null;
        this.lastTime = 0;
        this.gameActive = false;
        
        // Score tracking
        this.correctBalloonsPopped = 0;
        this.incorrectBalloonsPopped = 0;
        this.totalCorrectBalloons = 0;
        
        // Audio
        this.audioContext = null;
        this.audioEnabled = BALLOON_CONFIG.AUDIO_ENABLED;
        this.muteButton = null;
        this.muteContainer = null;
        
        // DOM elements
        this.container = document.getElementById('balloonContainer');
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
        this.initializeRainbow();
        this.createMuteButton();
        this.setupEventListeners();
        this.createSVG();
        this.loadGameState();
        this.startNewQuestion();
    }
    
    initializeRainbow() {
        // Rainbow will auto-initialize using the global CONFIG we set
        // No need to override its initialization
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
        muteContainer.style.position = 'fixed';
        muteContainer.style.top = '20px';
        muteContainer.style.right = '20px';
        muteContainer.style.zIndex = '1000';
        muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        muteContainer.style.borderRadius = '50%';
        muteContainer.style.width = '60px';
        muteContainer.style.height = '60px';
        muteContainer.style.display = 'flex';
        muteContainer.style.alignItems = 'center';
        muteContainer.style.justifyContent = 'center';
        muteContainer.style.cursor = 'pointer';
        muteContainer.style.transition = 'all 0.3s ease';
        muteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        this.muteButton = document.createElement('button');
        this.muteButton.style.background = 'none';
        this.muteButton.style.border = 'none';
        this.muteButton.style.color = 'white';
        this.muteButton.style.fontSize = '24px';
        this.muteButton.style.cursor = 'pointer';
        this.muteButton.style.width = '100%';
        this.muteButton.style.height = '100%';
        this.muteButton.style.display = 'flex';
        this.muteButton.style.alignItems = 'center';
        this.muteButton.style.justifyContent = 'center';
        
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
        this.svg.setAttribute('id', 'balloonSVG');
        this.svg.setAttribute('class', 'balloon-svg');
        this.updateSVGDimensions();
        
        this.container.appendChild(this.svg);
    }
    
    updateSVGDimensions() {
        if (this.svg) {
            this.svg.setAttribute('viewBox', `0 0 ${BALLOON_CONFIG.SVG_WIDTH} ${BALLOON_CONFIG.SVG_HEIGHT}`);
            this.svg.setAttribute('width', '100%');
            this.svg.setAttribute('height', '100%');
        }
    }
    
    handleResize() {
        if (this.svg) {
            this.updateSVGDimensions();
        }
        this.initializeRainbow();
    }
    
    loadGameState() {
        // Don't use localStorage in Claude.ai - use in-memory storage
        this.currentLevel = this.sessionLevel || 1;
        this.levelProgress = this.sessionProgress || {};
        
        // Initialize level progress if needed
        for (let level = 1; level <= 4; level++) {
            if (!this.levelProgress[level]) {
                this.levelProgress[level] = 0;
            }
        }
    }
    
    saveGameState() {
        // Store in memory for this session
        this.sessionLevel = this.currentLevel;
        this.sessionProgress = this.levelProgress;
    }
    
    startNewGame() {
        // Reset used numbers for new game
        this.usedNumbers.clear();
        
        // Hide modal
        if (this.modal) this.modal.classList.add('hidden');
        
        // Reset rainbow and bear
        this.rainbow.reset();
        this.bear.reset();
        
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        this.questionCount++;
        this.gameActive = true;
        this.balloons = [];
        this.fallingNumbers = [];
        this.balloonsSpawned = 0;
        this.correctBalloonsPopped = 0;
        this.incorrectBalloonsPopped = 0;
        this.totalCorrectBalloons = 0;
        
        // Clear SVG
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        // Select target number for current level
        this.selectTargetNumber();
        
        // Show target number first, then start game
        this.showTargetNumber();
    }
    
    selectTargetNumber() {
        const levelNumbers = BALLOON_CONFIG.LEVELS[this.currentLevel].numbers;
        const availableNumbers = levelNumbers.filter(num => !this.usedNumbers.has(num));
        
        // If all numbers used, reset the used numbers set
        if (availableNumbers.length === 0) {
            this.usedNumbers.clear();
            this.targetNumber = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
        } else {
            this.targetNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
        
        this.usedNumbers.add(this.targetNumber);
    }
    
    showTargetNumber() {
        // Create target number display
        const targetDisplay = document.createElement('div');
        targetDisplay.id = 'targetNumberDisplay';
        targetDisplay.style.position = 'fixed';
        targetDisplay.style.top = '50%';
        targetDisplay.style.left = '50%';
        targetDisplay.style.transform = 'translate(-50%, -50%)';
        targetDisplay.style.zIndex = '100';
        targetDisplay.style.textAlign = 'center';
        targetDisplay.style.opacity = '0';
        targetDisplay.style.transition = 'opacity 1s ease-in-out';
        
        // Large number
        const numberElement = document.createElement('div');
        numberElement.textContent = this.targetNumber.toString();
        numberElement.style.fontSize = '8rem';
        numberElement.style.fontWeight = 'bold';
        numberElement.style.color = '#dc3545';
        numberElement.style.fontFamily = 'Arial, sans-serif';
        numberElement.style.lineHeight = '1';
        numberElement.style.marginBottom = '10px';
        
        // Text version
        const textElement = document.createElement('div');
        textElement.textContent = BALLOON_CONFIG.NUMBER_TO_WORD[this.targetNumber] || this.targetNumber.toString();
        textElement.style.fontSize = '2rem';
        textElement.style.fontWeight = 'bold';
        textElement.style.color = '#dc3545';
        textElement.style.fontFamily = 'Arial, sans-serif';
        
        targetDisplay.appendChild(numberElement);
        targetDisplay.appendChild(textElement);
        document.body.appendChild(targetDisplay);
        
        // Fade in
        setTimeout(() => {
            targetDisplay.style.opacity = '1';
        }, 100);
        
        // Give audio instruction
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText(`Pop all the balloons with the number ${this.targetNumber}`);
            }, 1000);
        }
        
        // Fade out and start game
        setTimeout(() => {
            targetDisplay.style.opacity = '0';
            setTimeout(() => {
                if (targetDisplay.parentNode) {
                    targetDisplay.parentNode.removeChild(targetDisplay);
                }
                this.startBalloonSpawning();
            }, 1000);
        }, 4000); // Stay for 1s fade in + 3s display + start fade out
    }
    
    startBalloonSpawning() {
        // Start spawning balloons
        this.spawnBalloons();
        
        // Fade in all balloons over 1 second
        setTimeout(() => {
            this.balloons.forEach(balloon => {
                if (balloon.group) {
                    balloon.group.style.opacity = '1';
                }
            });
        }, 100);
        
        // Start animation loop
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    spawnBalloons() {
        // Create array of balloon numbers
        const balloonNumbers = [];
        
        // Add correct balloons
        for (let i = 0; i < BALLOON_CONFIG.CORRECT_BALLOONS; i++) {
            balloonNumbers.push(this.targetNumber);
        }
        
        // Add incorrect balloons
        const levelNumbers = BALLOON_CONFIG.LEVELS[this.currentLevel].numbers;
        const incorrectNumbers = levelNumbers.filter(num => num !== this.targetNumber);
        
        for (let i = 0; i < BALLOON_CONFIG.INCORRECT_BALLOONS; i++) {
            const randomNumber = incorrectNumbers[Math.floor(Math.random() * incorrectNumbers.length)];
            balloonNumbers.push(randomNumber);
        }
        
        // Shuffle the array
        this.shuffleArray(balloonNumbers);
        
        // Schedule balloon spawns (all at once, not staggered)
        balloonNumbers.forEach((number, index) => {
            this.createBalloon(number);
        });
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    createBalloon(number) {
        const isCorrect = number === this.targetNumber;
        if (isCorrect) {
            this.totalCorrectBalloons++;
        }
        
        // Generate random position across game width
        const gameAreaWidth = BALLOON_CONFIG.SVG_WIDTH;
        const constrainedWidth = gameAreaWidth * 0.9;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2;
        const x = startOffset + (Math.random() * (constrainedWidth - BALLOON_CONFIG.BALLOON_RADIUS * 2));
        
        // Start approximately 20% above the bottom of the game area (visible initially)
const minStartHeight = BALLOON_CONFIG.SVG_HEIGHT * 0.8;  // 80% from top = 20% from bottom
const maxStartHeight = BALLOON_CONFIG.SVG_HEIGHT * 0.9;  // 90% from top = 10% from bottom
const y = minStartHeight + Math.random() * (maxStartHeight - minStartHeight);

        const balloon = {
            x: x,
            y: y,
            number: number,
            isCorrect: isCorrect,
            riseSpeed: BALLOON_CONFIG.BALLOON_RISE_SPEED_MIN + 
                      Math.random() * (BALLOON_CONFIG.BALLOON_RISE_SPEED_MAX - BALLOON_CONFIG.BALLOON_RISE_SPEED_MIN),
            sidewaysSpeed: BALLOON_CONFIG.BALLOON_SIDEWAYS_SPEED_MIN + 
                          Math.random() * (BALLOON_CONFIG.BALLOON_SIDEWAYS_SPEED_MAX - BALLOON_CONFIG.BALLOON_SIDEWAYS_SPEED_MIN),
            sidewaysDirection: Math.random() > 0.5 ? 1 : -1,
            popped: false,
            color: BALLOON_CONFIG.BALLOON_COLORS[Math.floor(Math.random() * BALLOON_CONFIG.BALLOON_COLORS.length)],
            radius: BALLOON_CONFIG.BALLOON_RADIUS
        };
        
        // Create balloon visual elements
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        
        // Balloon string
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        // Balloon circle
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + balloon.radius);
        balloonCircle.setAttribute('cy', balloon.y + balloon.radius);
        balloonCircle.setAttribute('r', balloon.radius);
        balloonCircle.setAttribute('fill', balloon.color);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        
        // Highlight
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
        highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
        highlight.setAttribute('r', 14);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        
        // Number text (digit, not word) - larger and black
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloon.radius);
        numberText.setAttribute('y', balloon.y + balloon.radius + 2);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '36'); // Increased from 32 to 36
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', '#000000'); // Black color
        numberText.textContent = number.toString(); // Use digit, not word
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        balloonGroup.appendChild(numberText);
        
        // Event listeners
        balloonGroup.addEventListener('click', () => this.popBalloon(balloon, true));
        balloonGroup.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.popBalloon(balloon, true); 
        });
        
        balloon.group = balloonGroup;
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.text = numberText;
        
        this.svg.appendChild(balloonGroup);
        this.balloons.push(balloon);
    }
    
    createBalloonString(balloon) {
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const startX = balloon.x + balloon.radius;
        const startY = balloon.y + balloon.radius * 2;
        const endX = startX;
        const endY = startY + 120;
        
        const pathData = `M ${startX} ${startY} 
                         C ${startX + 6} ${startY + 12}, ${startX + 18} ${startY + 18}, ${startX + 18} ${startY + 30}
                         C ${startX + 18} ${startY + 42}, ${startX - 18} ${startY + 48}, ${startX - 18} ${startY + 60}
                         C ${startX - 18} ${startY + 72}, ${startX + 12} ${startY + 78}, ${startX + 12} ${startY + 90}
                         C ${startX + 12} ${startY + 102}, ${endX - 6} ${endY - 12}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513');
        string.setAttribute('stroke-width', 3.5);
        string.setAttribute('fill', 'none');
        
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        
        return string;
    }
    
    popBalloon(balloon, poppedByUser = true) {
        if (balloon.popped || !this.gameActive) return;
        balloon.popped = true;
        
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            this.correctBalloonsPopped++;
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            if (this.audioEnabled) this.playCompletionSound();
            
            if (poppedByUser && this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                setTimeout(() => {
                    this.speakText(encouragements[Math.floor(Math.random() * encouragements.length)]);
                }, 200);
            }
        } else {
            this.incorrectBalloonsPopped++;
            if (this.audioEnabled) this.playFailureSound();
        }
        
        if (balloon.group) balloon.group.remove();
        
        // Remove balloon from array
        const index = this.balloons.indexOf(balloon);
        if (index > -1) {
            this.balloons.splice(index, 1);
        }
        
        this.checkQuestionCompletion();
    }
    
    createPopEffect(x, y) {
        // No pop effect stars - removed completely
    }
    
    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = BALLOON_CONFIG.SVG_HEIGHT;
        const grassBandTop = gameAreaHeight - grassBandHeight;
        
        const minHeightFromTop = grassBandHeight * 0.2;
        const maxHeightFromTop = grassBandHeight * 0.6;
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        const fallingNumber = {
            x: x, // Fixed x position - no sideways movement
            y: y,
            targetY: targetY,
            number: number,
            speed: BALLOON_CONFIG.FALLING_NUMBER_SPEED,
            element: null,
            landed: false,
            landedTime: 0 // Track when it landed
        };
        
        // Create group for lozenge background and text
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('class', 'falling-number-group');
        
        // Create lozenge background
        const lozenge = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        lozenge.setAttribute('cx', fallingNumber.x);
        lozenge.setAttribute('cy', fallingNumber.y);
        lozenge.setAttribute('rx', '45'); // Width
        lozenge.setAttribute('ry', '22'); // Height
        lozenge.setAttribute('fill', '#add8e6'); // Light blue
        lozenge.setAttribute('stroke', '#4682b4'); // Darker blue border
        lozenge.setAttribute('stroke-width', '2');
        
        // Create text element with word version of number
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', fallingNumber.x);
        numberElement.setAttribute('y', fallingNumber.y + 2);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '24'); // Slightly smaller to fit in lozenge
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', '#1e3a8a'); // Dark blue text
        numberElement.textContent = BALLOON_CONFIG.NUMBER_TO_WORD[number] || number.toString();
        
        numberGroup.appendChild(lozenge);
        numberGroup.appendChild(numberElement);
        
        fallingNumber.element = numberGroup;
        fallingNumber.lozenge = lozenge;
        fallingNumber.text = numberElement;
        
        this.fallingNumbers.push(fallingNumber);
        this.svg.appendChild(numberGroup);
        
        return fallingNumber;
    }
    
    gameLoop(currentTime) {
        if (!this.gameActive) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update balloons
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                // Move balloon up (negative direction in SVG coordinates)
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Check if balloon reached top (y <= 0 means above screen)
                if (balloon.y + balloon.radius <= 0) {
                    this.popBalloon(balloon, false); // Auto-pop, not user-popped
                    return;
                }
                
                // Move balloon sideways with individual speed
                balloon.x += balloon.sidewaysSpeed * balloon.sidewaysDirection * deltaTime;
                
                // Bounce off walls
                const gameAreaWidth = BALLOON_CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                if (balloon.x <= 0) {
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                // Update balloon visual elements
                if (balloon.circle) {
                    balloon.circle.setAttribute('cx', balloon.x + balloon.radius);
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
                }
                if (balloon.text) {
                    balloon.text.setAttribute('x', balloon.x + balloon.radius);
                    balloon.text.setAttribute('y', balloon.y + balloon.radius + 2);
                }
                
                // Update string
                if (balloon.string) {
                    const currentStartX = balloon.x + balloon.radius;
                    const currentStartY = balloon.y + balloon.radius * 2;
                    const deltaX = currentStartX - balloon.stringStartX;
                    const deltaY = currentStartY - balloon.stringStartY;
                    const newEndX = balloon.stringEndX + deltaX;
                    const newEndY = balloon.stringEndY + deltaY;
                    
                    const pathData = `M ${currentStartX} ${currentStartY} 
                                     C ${currentStartX + 6} ${currentStartY + 12}, ${currentStartX + 18} ${currentStartY + 18}, ${currentStartX + 18} ${currentStartY + 30}
                                     C ${currentStartX + 18} ${currentStartY + 42}, ${currentStartX - 18} ${currentStartY + 48}, ${currentStartX - 18} ${currentStartY + 60}
                                     C ${currentStartX - 18} ${currentStartY + 72}, ${currentStartX + 12} ${currentStartY + 78}, ${currentStartX + 12} ${currentStartY + 90}
                                     C ${currentStartX + 12} ${currentStartY + 102}, ${newEndX - 6} ${newEndY - 12}, ${newEndX} ${newEndY}`;
                    
                    balloon.string.setAttribute('d', pathData);
                }
            }
        });
        
        // Update falling numbers - fall straight down
        this.fallingNumbers.forEach((fallingNumber, index) => {
            if (!fallingNumber.landed) {
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    fallingNumber.landedTime = currentTime; // Record when it landed
                }
                
                // Update both lozenge and text positions
                if (fallingNumber.lozenge) {
                    fallingNumber.lozenge.setAttribute('cy', fallingNumber.y);
                }
                if (fallingNumber.text) {
                    fallingNumber.text.setAttribute('y', fallingNumber.y + 2);
                }
            } else {
                // Check if it's time to remove landed numbers (after 3 seconds)
                if (currentTime - fallingNumber.landedTime > 3000) {
                    if (fallingNumber.element && fallingNumber.element.parentNode) {
                        fallingNumber.element.parentNode.removeChild(fallingNumber.element);
                    }
                    this.fallingNumbers.splice(index, 1);
                }
            }
        });
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    checkQuestionCompletion() {
        // Check if all correct balloons have been handled (popped or reached top)
        const remainingCorrectBalloons = this.balloons.filter(b => b.isCorrect && !b.popped).length;
        const totalCorrectBalloons = this.totalCorrectBalloons;
        const correctBalloonsHandled = totalCorrectBalloons - remainingCorrectBalloons;
        
        // Check if all falling numbers have landed
        const allNumbersLanded = this.fallingNumbers.every(fn => fn.landed);
        
        // Question is complete when all correct balloons handled and all numbers landed
        if (correctBalloonsHandled >= totalCorrectBalloons && allNumbersLanded) {
            this.endQuestion();
        }
    }
    
    endQuestion() {
        this.gameActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear remaining balloons
        this.balloons.forEach(balloon => {
            if (balloon.group) balloon.group.remove();
        });
        this.balloons = [];
        
        // Evaluate performance
        const success = this.correctBalloonsPopped >= BALLOON_CONFIG.MIN_CORRECT_BALLOONS && 
                       this.incorrectBalloonsPopped <= BALLOON_CONFIG.MAX_INCORRECT_BALLOONS;
        
        // Update progress
        if (success) {
            this.levelProgress[this.currentLevel]++;
            this.rainbow.addPiece();
        }
        
        // Save state
        this.saveGameState();
        
        // Give audio feedback
        this.giveQuestionFeedback(success);
        
        // Check for level progression
        setTimeout(() => {
            this.checkLevelProgression(success);
        }, 2000);
    }
    
    giveQuestionFeedback(success) {
        if (!this.audioEnabled) return;
        
        let message = '';
        
        if (success) {
            message = `Well done, you popped ${this.correctBalloonsPopped} out of 10 of the number ${this.targetNumber} balloons`;
            if (this.incorrectBalloonsPopped === 0) {
                message += ' and none of the other balloons';
            } else {
                message += ` and only ${this.incorrectBalloonsPopped} of the other balloons`;
            }
        } else {
            message = `You popped ${this.correctBalloonsPopped} out of 10 of the number ${this.targetNumber} balloons`;
            if (this.incorrectBalloonsPopped === 0) {
                message += ' and none of the other balloons';
            } else {
                message += ` and ${this.incorrectBalloonsPopped} of the other balloons`;
            }
            
            // Add specific failure advice
            const tooFewCorrect = this.correctBalloonsPopped < BALLOON_CONFIG.MIN_CORRECT_BALLOONS;
            const tooManyIncorrect = this.incorrectBalloonsPopped > BALLOON_CONFIG.MAX_INCORRECT_BALLOONS;
            
            if (tooFewCorrect && tooManyIncorrect) {
                message += '. Next time try to pop all of the balloons with the chosen number in, and only those balloons';
            } else if (tooFewCorrect) {
                message += '. Next time try to pop more balloons';
            } else if (tooManyIncorrect) {
                message += '. Next time only pop the balloons with the right number in';
            }
        }
        
        setTimeout(() => {
            this.speakText(message);
        }, 500);
    }
    
    checkLevelProgression(success) {
        const currentProgress = this.levelProgress[this.currentLevel];
        const requiredProgress = BALLOON_CONFIG.LEVELS[this.currentLevel].questionsNeeded;
        
        if (success && currentProgress >= requiredProgress) {
            // Level completed
            if (this.currentLevel < 4) {
                this.currentLevel++;
                this.saveGameState();
                this.showLevelCompleteModal();
            } else {
                // Game completed
                this.showGameCompleteModal();
            }
        } else if (!success && this.currentLevel > 1) {
            // Failure - drop back to previous level
            this.currentLevel--;
            this.levelProgress[this.currentLevel] = Math.max(0, this.levelProgress[this.currentLevel] - 1);
            this.saveGameState();
            this.startNewQuestion();
        } else {
            // Continue at current level
            this.startNewQuestion();
        }
    }
    
    showLevelCompleteModal() {
        if (this.modal && this.modalTitle && this.modalMessage) {
            this.modalTitle.textContent = '🎉 Level Complete! 🎉';
            this.modalMessage.textContent = `Great job! You've completed Level ${this.currentLevel - 1}. Moving to Level ${this.currentLevel}: ${BALLOON_CONFIG.LEVELS[this.currentLevel].name}`;
            this.modal.classList.remove('hidden');
            
            this.bear.startCelebration();
            
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText(`Level complete! Moving to level ${this.currentLevel}`);
                }, 1000);
            }
        }
    }
    
    showGameCompleteModal() {
        if (this.modal && this.modalTitle && this.modalMessage) {
            this.modalTitle.textContent = '🏆 Game Complete! 🏆';
            this.modalMessage.textContent = 'Congratulations! You have successfully completed all levels of the Balloon Number Game!';
            this.modal.classList.remove('hidden');
            
            this.bear.startCelebration();
            
            if (this.audioEnabled) {
                setTimeout(() => {
                    this.speakText('Congratulations! You have completed all levels!');
                }, 1000);
            }
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
    
    playCompletionSound() {
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
    
    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            // Silent failure
        }
    }
    
    destroy() {
        this.gameActive = false;
        
        window.removeEventListener('resize', this.handleResize);
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        this.balloons = [];
        this.fallingNumbers = [];
        
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
    window.balloonGame = new BalloonGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.balloonGame) {
        window.balloonGame.destroy();
    }
});
