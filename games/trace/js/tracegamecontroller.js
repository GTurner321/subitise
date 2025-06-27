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
        this.currentVoiceGender = 'boy';
        
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
        this.currentNumberIndex = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        this.currentVoiceGender = 'boy';
        
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
    
    this.currentNumber = this.numbersSequence[this.currentNumberIndex];
    this.updateNumberWordDisplay('');
    
    if (!this.renderer.renderNumber(this.currentNumber)) return;
    
    // ADDED: Ensure PathManager knows the current number
    if (this.pathManager) {
        this.pathManager.setCurrentNumber(this.currentNumber);
    }
    
    this.pathManager.startNewStroke(0);
    
    if (this.audioEnabled) {
        this.speakText(`Trace the number ${this.currentNumber}`, this.currentVoiceGender);
    }
}
    
    startCurrentNumberOver() {
        this.renderer.renderNumber(this.currentNumber);
        this.pathManager.startNewStroke(0);
        this.updateNumberWordDisplay('');
    }

    handleStrokeCompletion(strokeIndex) {
        const totalStrokes = this.renderer.getStrokeCount();
        if (strokeIndex + 1 < totalStrokes) {
            this.pathManager.moveToNextStroke();
        }
    }

    handleNumberCompletion() {
        if (this.isProcessingCompletion) return;
        this.isProcessingCompletion = true;
        this.pathManager.cleanup();
        this.rainbow.addPiece();
        this.startBalloonMiniGame();
    }

    // BALLOON GAME
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
                    this.currentVoiceGender,
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
        
        // Create balloon string
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        // Create balloon circle (larger - 54px radius)
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + balloon.radius);
        balloonCircle.setAttribute('cy', balloon.y + balloon.radius);
        balloonCircle.setAttribute('r', balloon.radius);
        balloonCircle.setAttribute('fill', balloon.color);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        
        // Create highlight
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + balloon.radius - 17);
        highlight.setAttribute('cy', balloon.y + balloon.radius - 17);
        highlight.setAttribute('r', 14);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        
        // Create text (larger - 26px font)
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
        
        // Store string data for animation
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        
        return string;
    }

    // SIMPLIFIED: Pop balloon and create falling number for ALL correct balloons (clicked OR ceiling hit)
    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        balloon.popped = true;
        
        // Create flashing pop effect
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        // If this is a correct balloon, ALWAYS create falling number
        if (balloon.isCorrect) {
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            if (this.audioEnabled) this.playCompletionSound();
            
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                setTimeout(() => {
                    this.speakText(encouragements[Math.floor(Math.random() * encouragements.length)], this.currentVoiceGender);
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

    // SIMPLIFIED: Animate balloons and check for completion
    animateBalloons(currentTime = performance.now()) {
        if (!this.playingBalloonGame) return;
        
        const deltaTime = (currentTime - this.balloonLastTime) / 1000;
        this.balloonLastTime = currentTime;
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // SIMPLE: If balloon hits ceiling AND it's correct, pop it (which creates falling number)
                if (balloon.y <= 0) {
                    if (balloon.isCorrect) {
                        this.popBalloon(balloon); // This will create the falling number
                    } else {
                        // Just remove incorrect balloons that hit ceiling
                        balloon.popped = true;
                        if (balloon.group) balloon.group.remove();
                    }
                    return;
                }
                
                balloon.x += Math.abs(balloon.sidewaysSpeed) * balloon.sidewaysDirection * deltaTime;
                
                // Bounce off edges
                const gameAreaWidth = CONFIG.SVG_WIDTH;
                const balloonWidth = balloon.radius * 2;
                if (balloon.x <= 0) {
                    balloon.x = 0;
                    balloon.sidewaysDirection = 1;
                } else if (balloon.x + balloonWidth >= gameAreaWidth) {
                    balloon.x = gameAreaWidth - balloonWidth;
                    balloon.sidewaysDirection = -1;
                }
                
                // Update balloon position
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
        
        // Update falling numbers
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
        
        // SIMPLE: Check if we have 3 landed numbers of the correct type
        this.checkBalloonGameCompletion();
        
        this.balloonAnimationId = requestAnimationFrame((time) => this.animateBalloons(time));
    }

    // SIMPLIFIED: Just check if we have 3 correct numbers that have landed
    checkBalloonGameCompletion() {
        const correctLandedNumbers = this.fallingNumbers.filter(fn => 
            fn.number === this.currentNumber && fn.landed
        );
        
        // Complete when we have 3 correct numbers landed AND speech is done
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
        
        this.switchVoiceGender();
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

    switchVoiceGender() {
        this.currentVoiceGender = this.currentVoiceGender === 'boy' ? 'girl' : 'boy';
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
                this.speakText('Excellent work! You traced all the numbers!', this.currentVoiceGender);
            }, 1000);
        }
    }

    // AUDIO METHODS
    speakText(text, preferredGender = null) {
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
                    voice.name.toLowerCase().includes(preferredGender) ||
                    voice.name.toLowerCase().includes('female')
                );
                
                if (selectedVoice) utterance.voice = selectedVoice;
                
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech failed:', error);
        }
    }

    speakTextWithCallback(text, preferredGender = null, callback = null) {
        if (!this.audioEnabled) {
            if (callback) callback();
            return;
        }
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = preferredGender === 'girl' ? 1.4 : 1.3;
                utterance.volume = 0.8;
                
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech failed:', error);
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
            console.warn('Completion sound failed:', error);
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
            console.warn('Failure sound failed:', error);
        }
    }

    // UTILITY METHODS
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
            progress: this.numbersCompleted / CONFIG.NUMBERS_TO_COMPLETE
        };
    }

    isGameComplete() {
        return this.gameComplete;
    }

    skipToNextNumber() {
        if (!CONFIG.DEBUG_MODE) return;
        
        // Force complete current number and move to next
        this.numbersCompleted++;
        
        if (this.numbersCompleted >= CONFIG.NUMBERS_TO_COMPLETE) {
            this.completeGame();
            return;
        }
        
        // Move to next number
        this.currentNumberIndex++;
        if (this.currentNumberIndex >= this.numbersSequence.length) {
            this.currentNumberIndex = 0; // Wrap around if needed
        }
        
        this.startNewNumber();
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

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) window.traceGame.handleVisibilityChange();
    });
    
    window.traceGame = new TraceGameController();
});

window.addEventListener('beforeunload', () => {
    if (window.traceGame) window.traceGame.destroy();
});
