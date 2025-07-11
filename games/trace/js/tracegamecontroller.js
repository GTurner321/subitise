class TraceGameController {
    constructor() {
        this.renderer = null;
        this.pathManager = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        this.currentNumberIndex = 0;
        this.currentNumber = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.totalCorrectBalloons = 3;
        this.balloonAnimationId = null;
        this.balloonLastTime = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
        
        this.numbersSequence = [...CONFIG.NUMBERS_SEQUENCE];
        
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        this.initializeGame();
    }

    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.initializeRainbow();
        
        this.renderer = new TraceNumberRenderer();
        if (!this.renderer.initialize('traceContainer')) return;
        
        this.pathManager = new TracePathManager(this.renderer.svg, this.renderer);
        await this.waitForDependencies();
        this.setupEventListeners();
        this.startNewNumber();
    }

    initializeRainbow() {
        const gameWidth = CONFIG.SVG_WIDTH;
        const rainbowWidth = gameWidth * 0.75;
        
        this.rainbow.initializeArcs = function() {
            this.container.innerHTML = '';
            for (let i = 0; i < this.maxPieces; i++) {
                const arc = document.createElement('div');
                arc.className = 'rainbow-arc';
                arc.id = `arc-${i}`;
                const baseRadius = rainbowWidth / 2;
                const radius = baseRadius - (i * this.arcWidth);
                arc.style.width = radius * 2 + 'px';
                arc.style.height = radius + 'px';
                arc.style.borderTopWidth = this.arcWidth + 'px';
                arc.style.borderTopColor = this.colors[i];
                arc.style.borderRadius = radius + 'px ' + radius + 'px 0 0';
                arc.style.position = 'absolute';
                arc.style.bottom = '0';
                arc.style.left = '50%';
                arc.style.transform = 'translateX(-50%)';
                arc.style.opacity = '0';
                arc.style.transition = 'opacity 0.5s ease-in-out';
                arc.style.pointerEvents = 'none';
                this.container.appendChild(arc);
            }
        };
        this.rainbow.initializeArcs();
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            const check = () => {
                if (typeof CONFIG !== 'undefined' && this.renderer && this.renderer.svg) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            setTimeout(check, 100);
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

    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        const originalCompleteNumber = this.renderer.completeNumber.bind(this.renderer);
        this.renderer.completeNumber = () => {
            originalCompleteNumber();
            this.handleNumberCompletion();
        };
        
        const originalCompleteStroke = this.renderer.completeStroke.bind(this.renderer);
        this.renderer.completeStroke = (strokeIndex) => {
            originalCompleteStroke(strokeIndex);
            this.handleStrokeCompletion(strokeIndex);
        };
        
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (CONFIG.DEBUG_MODE) {
            document.addEventListener('keydown', (e) => {
                if (e.key === ' ') { e.preventDefault(); this.renderer.completeNumber(); }
                if (e.key === 'r') { e.preventDefault(); this.startCurrentNumberOver(); }
                if (e.key >= '0' && e.key <= '9') { e.preventDefault(); this.skipToNumber(parseInt(e.key)); }
            });
        }
    }

    handleResize() {
        if (this.renderer && this.renderer.svg) {
            this.renderer.updateSVGDimensions();
        }
        this.initializeRainbow();
        if (this.renderer && this.currentNumber !== null) {
            this.renderer.renderNumber(this.currentNumber);
            if (this.pathManager && !this.playingBalloonGame) {
                this.pathManager.startNewStroke(this.renderer.currentStroke);
            }
        }
    }

    startNewGame() {
        this.removeGoButton(); // 👈 ADD THIS LINE AT THE TOP
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
        
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.renderer.reset();
        this.pathManager.reset();
        
        if (this.modal) this.modal.classList.add('hidden');
        this.updateNumberWordDisplay('');
        this.startNewNumber();
    }

startNewNumber() {
    if (this.currentNumberIndex >= this.numbersSequence.length) {
        this.completeGame();
        return;
    }
    
    // Special handling for the very first number (index 0) - show GO button
    if (this.currentNumberIndex === 0) {
        console.log('First number - showing GO button for audio activation');
        // Add a small delay to ensure SVG is ready
        setTimeout(() => {
            this.createGoButton();
        }, 500);
        return; // Exit here - the actual game start happens in startGameAfterGoButton()
    }
    
    // Normal behavior for all other numbers (1-9)
    this.currentNumber = this.numbersSequence[this.currentNumberIndex];
    this.updateNumberWordDisplay('');
    
    if (!this.renderer.renderNumber(this.currentNumber)) return;
    this.pathManager.startNewStroke(0);
    
    if (this.audioEnabled) {
        // For subsequent numbers, audio context should already be active
        this.speakText(`Trace the number ${this.currentNumber}`);
    }
}

// Updated GO Button implementation that uses CSS classes
// Add these methods to your TraceGameController class

createGoButton() {
    // Remove any existing go button
    this.removeGoButton();
    
    // Create button container with CSS class only
    this.goButtonContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.goButtonContainer.setAttribute('class', 'go-button-container go-button-entrance');
    
    // Button background circle - CSS class only
    const buttonBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    buttonBg.setAttribute('class', 'go-button-bg');
    buttonBg.setAttribute('cx', CONFIG.NUMBER_CENTER_X);
    buttonBg.setAttribute('cy', CONFIG.NUMBER_CENTER_Y);
    buttonBg.setAttribute('r', 80);
    
    // Main button circle - CSS class only
    const buttonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    buttonCircle.setAttribute('class', 'go-button-main');
    buttonCircle.setAttribute('cx', CONFIG.NUMBER_CENTER_X);
    buttonCircle.setAttribute('cy', CONFIG.NUMBER_CENTER_Y);
    buttonCircle.setAttribute('r', 60);
    
    // GO text - CSS class only
    const goText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    goText.setAttribute('class', 'go-button-text');
    goText.setAttribute('x', CONFIG.NUMBER_CENTER_X);
    goText.setAttribute('y', CONFIG.NUMBER_CENTER_Y + 8);
    goText.textContent = 'GO';
    
    // Assemble button - no inline animations, all handled by CSS
    this.goButtonContainer.appendChild(buttonBg);
    this.goButtonContainer.appendChild(buttonCircle);
    this.goButtonContainer.appendChild(goText);
    
    // Flag to prevent multiple clicks
    let isButtonClicked = false;
    
    // Single unified click handler
    const handleGoButtonClick = async (e) => {
        // Prevent multiple clicks
        if (isButtonClicked) {
            console.log('GO button already clicked, ignoring');
            return;
        }
        
        isButtonClicked = true;
        e.preventDefault();
        e.stopPropagation();
        
        console.log('GO button clicked - activating audio and starting game');
        
        // Add visual feedback with CSS class
        this.goButtonContainer.classList.add('go-button-clicked');
        
        // Remove event listeners immediately to prevent double-clicks
        this.goButtonContainer.removeEventListener('click', handleGoButtonClick);
        this.goButtonContainer.removeEventListener('touchstart', handleGoButtonClick);
        this.goButtonContainer.removeEventListener('pointerdown', handleGoButtonClick);
        
        try {
            // Activate audio context
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context activated successfully');
            }
            
            // Small delay for visual feedback, then animate exit
            setTimeout(() => {
                this.animateGoButtonExit(() => {
                    // Start the actual game after button disappears
                    this.startGameAfterGoButton();
                });
            }, 150);
            
        } catch (error) {
            console.error('Failed to activate audio:', error);
            // Still start the game even if audio fails
            setTimeout(() => {
                this.animateGoButtonExit(() => {
                    this.startGameAfterGoButton();
                });
            }, 150);
        }
    };
    
    // Add to SVG first
    this.renderer.svg.appendChild(this.goButtonContainer);
    
    // Add event listeners after a small delay to ensure button is ready
    setTimeout(() => {
        if (this.goButtonContainer) {
            // Use modern pointer events for better touch/mouse compatibility
            this.goButtonContainer.addEventListener('pointerdown', handleGoButtonClick, { passive: false });
            
            // Fallback for older browsers
            this.goButtonContainer.addEventListener('click', handleGoButtonClick, { passive: false });
            this.goButtonContainer.addEventListener('touchstart', handleGoButtonClick, { passive: false });
            
            console.log('GO button event listeners added');
        }
    }, 100);
    
    console.log('GO button created and ready for user interaction');
}
removeGoButton() {
    if (this.goButtonContainer) {
        this.goButtonContainer.remove();
        this.goButtonContainer = null;
    }
}

animateGoButtonExit(callback) {
    if (!this.goButtonContainer) {
        if (callback) callback();
        return;
    }
    
    // Use only CSS class for exit animation
    this.goButtonContainer.classList.add('go-button-exit');
    
    setTimeout(() => {
        this.removeGoButton();
        if (callback) callback();
    }, 400);
}

startGameAfterGoButton() {
    console.log('Starting game after GO button click');
    
    // Now start the first number with the original logic
    this.currentNumber = this.numbersSequence[this.currentNumberIndex];
    this.updateNumberWordDisplay('');
    
    // Render the number but start invisible
    if (!this.renderer.renderNumber(this.currentNumber)) return;
    
    // Make all number paths invisible initially
    const allPaths = this.renderer.svg.querySelectorAll('path');
    allPaths.forEach(path => {
        path.style.opacity = '0';
        path.style.transition = 'opacity 1s ease-in-out';
    });
    
    // After a brief delay, start fade in of the number
    setTimeout(() => {
        allPaths.forEach(path => {
            path.style.opacity = '1';
        });
    }, 300); // Slightly longer delay after button exit
    
    // After fade completes, start tracing and give instruction
    setTimeout(() => {
        this.pathManager.startNewStroke(0);
        
        // Audio should now work since user clicked GO button
        if (this.audioEnabled) {
            console.log('Speaking instruction for number', this.currentNumber);
            this.speakText(`Trace the number ${this.currentNumber}`);
        }
        
        // Remove transitions after first use
        allPaths.forEach(path => {
            path.style.transition = '';
        });
    }, 1500); // Adjusted timing for smooth flow
}
    
    startCurrentNumberOver() {
        this.renderer.renderNumber(this.currentNumber);
        this.pathManager.startNewStroke(0);
        this.updateNumberWordDisplay('');
    }

    handleStrokeCompletion(strokeIndex) {
        // Let TracePathManager handle stroke progression
    }
    
    handleNumberCompletion() {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;
        this.pathManager.cleanup();
        this.rainbow.addPiece();
        this.startBalloonMiniGame();
    }

    startBalloonMiniGame() {
        this.playingBalloonGame = true;
        this.correctBalloonsFound = 0;
        this.balloons = [];
        this.fallingNumbers = [];
        this.speechComplete = false;
        this.numbersLanded = false;
        
        this.updateNumberWordDisplay('');
        this.createBalloons();
        this.balloonLastTime = performance.now();
        this.animateBalloons();
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakTextWithCallback(
                    `Pop the balloons with the number ${this.currentNumber}!`,
                    () => {
                        this.speechComplete = true;
                    }
                );
            }, 500);
        } else {
            this.speechComplete = true;
        }
    }

    createBalloons() {
        const positions = this.generateNonOverlappingPositions(12, 120);
        const numbers = [];
        
        for (let i = 0; i < 3; i++) numbers.push(this.currentNumber);
        const availableNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== this.currentNumber);
        for (let i = 0; i < 9; i++) {
            numbers.push(availableNumbers[Math.floor(Math.random() * availableNumbers.length)]);
        }
        
        this.shuffleArray(numbers);
        
        for (let i = 0; i < 12; i++) {
            this.balloons.push(this.createBalloon(positions[i], numbers[i]));
        }
    }

    generateNonOverlappingPositions(count, width) {
        const positions = [];
        const gameAreaWidth = CONFIG.SVG_WIDTH;
        const constrainedWidth = gameAreaWidth * 0.9;
        const availableWidth = constrainedWidth - width;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2;
        
        for (let i = 0; i < count; i++) {
            let position;
            let attempts = 0;
            do {
                position = startOffset + (Math.random() * availableWidth);
                attempts++;
            } while (this.hasOverlap(position, positions, width + 20) && attempts < 50);
            positions.push(position);
        }
        return positions.sort((a, b) => a - b);
    }

    hasOverlap(newPos, existingPositions, minDistance) {
        return existingPositions.some(pos => Math.abs(newPos - pos) < minDistance);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    createBalloon(x, number) {
        const isCorrectNumber = number === this.currentNumber;
        const gameAreaHeight = CONFIG.SVG_HEIGHT - 80;
        const randomStartHeight = gameAreaHeight * 0.5 + Math.random() * (gameAreaHeight * 0.3);
        
        const balloonColors = ['#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF'];
        const numberWords = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' };
        
        const balloon = {
            x: x,
            y: randomStartHeight,
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: 20 + Math.random() * 20,
            sidewaysSpeed: (Math.random() - 0.5) * 30,
            sidewaysDirection: Math.sign((Math.random() - 0.5) * 30) || 1,
            popped: false,
            color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
            radius: 54
        };
        
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + balloon.radius);
        balloonCircle.setAttribute('cy', balloon.y + balloon.radius);
        balloonCircle.setAttribute('r', balloon.radius);
        balloonCircle.setAttribute('fill', balloon.color);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
        highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
        highlight.setAttribute('r', 14);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloon.radius);
        numberText.setAttribute('y', balloon.y + balloon.radius + 2);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '26');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('stroke', '#333');
        numberText.setAttribute('stroke-width', '1.4');
        numberText.textContent = numberWords[number];
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        balloonGroup.appendChild(numberText);
        
        balloonGroup.addEventListener('click', () => this.popBalloon(balloon));
        balloonGroup.addEventListener('touchstart', (e) => { e.preventDefault(); this.popBalloon(balloon); });
        
        balloon.group = balloonGroup;
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.textWord = numberText;
        
        this.renderer.svg.appendChild(balloonGroup);
        return balloon;
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

    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        balloon.popped = true;
        
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            if (this.audioEnabled) this.playCompletionSound();
            
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                setTimeout(() => {
                    this.speakText(encouragements[Math.floor(Math.random() * encouragements.length)]);
                }, 200);
            }
        } else {
            if (this.audioEnabled) this.playFailureSound();
        }
        
        if (balloon.group) balloon.group.remove();
    }

    createPopEffect(x, y) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x);
        star.setAttribute('y', y);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('dominant-baseline', 'middle');
        star.setAttribute('font-size', '50');
        star.setAttribute('fill', '#FFD700');
        star.setAttribute('class', 'pop-star');
        star.textContent = '💥';
        
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '0;1;0;1;0');
        animate.setAttribute('dur', '0.6s');
        animate.setAttribute('fill', 'freeze');
        
        star.appendChild(animate);
        this.renderer.svg.appendChild(star);
        
        setTimeout(() => {
            if (star.parentNode) star.parentNode.removeChild(star);
        }, 600);
    }

    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = CONFIG.SVG_HEIGHT;
        const grassBandTop = gameAreaHeight - grassBandHeight;
        
        const minHeightFromTop = grassBandHeight * 0.2;
        const maxHeightFromTop = grassBandHeight * 0.6;
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        const fallingNumber = {
            x: x,
            startX: x,
            y: y,
            targetY: targetY,
            number: number,
            speed: 180,
            element: null,
            landed: false
        };
        
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', fallingNumber.startX);
        numberElement.setAttribute('y', fallingNumber.y);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '60');
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', CONFIG.FILL_COLOR);
        numberElement.setAttribute('stroke', 'white');
        numberElement.setAttribute('stroke-width', 2);
        numberElement.setAttribute('class', 'falling-number-static');
        numberElement.textContent = number;
        
        fallingNumber.element = numberElement;
        this.fallingNumbers.push(fallingNumber);
        this.renderer.svg.appendChild(numberElement);
        
        return fallingNumber;
    }

    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                if (balloon.y <= 0) {
                    if (balloon.isCorrect) {
                        this.popBalloon(balloon);
                    } else {
                        balloon.popped = true;
                        if (balloon.group) balloon.group.remove();
                    }
                    return;
                }
                
                balloon.x += Math.abs(balloon.sidewaysSpeed) * balloon.sidewaysDirection * deltaTime;
                
                const gameAreaWidth = CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                if (balloon.x <= 0) {
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                if (balloon.circle) {
                    balloon.circle.setAttribute('cx', balloon.x + balloon.radius);
                    balloon.circle.setAttribute('cy', balloon.y + balloon.radius);
                }
                if (balloon.highlight) {
                    balloon.highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
                    balloon.highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
                }
                if (balloon.textWord) {
                    balloon.textWord.setAttribute('x', balloon.x + balloon.radius);
                    balloon.textWord.setAttribute('y', balloon.y + balloon.radius + 2);
                }
                
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
        
        this.fallingNumbers.forEach(fallingNumber => {
            if (!fallingNumber.landed) {
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                }
                
                if (fallingNumber.element) {
                    fallingNumber.element.setAttribute('y', fallingNumber.y);
                }
            }
        });
        
        this.checkBalloonGameCompletion();
        
        this.balloonAnimationId = requestAnimationFrame((time) => this.animateBalloons(time));
    }

    checkBalloonGameCompletion() {
        const correctLandedNumbers = this.fallingNumbers.filter(fn => 
            fn.number === this.currentNumber && fn.landed
        );
        
        if (correctLandedNumbers.length >= 3 && this.speechComplete) {
            this.onBalloonGameComplete();
        }
    }

    onBalloonGameComplete() {
        this.playingBalloonGame = false;
        
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        
        this.clearBalloonGameElements();
        this.numbersCompleted++;
        
        if (this.rainbow.isComplete()) {
            setTimeout(() => this.completeGame(), 1000);
            return;
        }
        
        setTimeout(() => this.moveToNextNumber(), 1000);
    }

    clearBalloonGameElements() {
        const elementsToRemove = this.renderer.svg.querySelectorAll('.balloon-group, .falling-number-static, .pop-star');
        elementsToRemove.forEach(element => element.remove());
        
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
    }

    moveToNextNumber() {
        this.currentNumberIndex++;
        this.isProcessingCompletion = false;
        this.startNewNumber();
    }

    updateNumberWordDisplay(text) {
        if (this.numberWordDisplay) {
            this.numberWordDisplay.textContent = text;
            if (text) {
                this.numberWordDisplay.classList.add('visible');
            } else {
                this.numberWordDisplay.classList.remove('visible');
            }
        }
    }

    completeGame() {
        if (this.gameComplete) return;
        this.gameComplete = true;
        this.pathManager.cleanup();
        
        if (this.modal) this.modal.classList.remove('hidden');
        this.bear.startCelebration();
        
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Excellent work! You traced all the numbers!');
            }, 1000);
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
                utterance.pitch = 1.3;
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            // Silent failure
        }
    }

    speakTextWithCallback(text, callback) {
        if (!this.audioEnabled) {
            if (callback) callback();
            return;
        }
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            if (callback) callback();
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

    handleVisibilityChange() {
        if (document.hidden) {
            if ('speechSynthesis' in window) speechSynthesis.pause();
        } else {
            if ('speechSynthesis' in window) speechSynthesis.resume();
        }
    }

    getCurrentNumber() {
        return this.currentNumber;
    }

    getCurrentProgress() {
        return {
            currentNumber: this.currentNumber,
            currentIndex: this.currentNumberIndex,
            totalNumbers: this.numbersSequence.length,
            completed: this.numbersCompleted,
            progress: this.numbersCompleted / 10
        };
    }

    isGameComplete() {
        return this.gameComplete;
    }

    skipToNumber(number) {
        if (!CONFIG.DEBUG_MODE) return;
        const index = this.numbersSequence.indexOf(number);
        if (index !== -1) {
            this.currentNumberIndex = index;
            this.startNewNumber();
        }
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
    }

    destroy() {
        this.removeGoButton(); // 👈 ADD THIS LINE AT THE TOP
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.pathManager) this.pathManager.cleanup();
        
        if (this.balloonAnimationId) {
            cancelAnimationFrame(this.balloonAnimationId);
            this.balloonAnimationId = null;
        }
        this.clearBalloonGameElements();
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer.reset();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        if (this.audioContext) this.audioContext.close();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) window.traceGame.handleVisibilityChange();
    });
    
    window.traceGame = new TraceGameController();
});

window.addEventListener('beforeunload', () => {
    if (window.traceGame) window.traceGame.destroy();
});
