class TraceGameController {
    constructor() {
        // Core components
        this.renderer = null;
        this.pathManager = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentNumberIndex = 0;
        this.currentNumber = 0;
        this.numbersCompleted = 0;
        this.gameComplete = false;
        this.isProcessingCompletion = false;
        this.playingBalloonGame = false;
        
        // Balloon game state
        this.balloons = [];
        this.fallingNumbers = [];
        this.correctBalloonsFound = 0;
        this.totalCorrectBalloons = 3;
        this.balloonAnimationId = null;
        this.balloonLastTime = 0;
        this.speechComplete = false;
        this.numbersLanded = false;
        
        // Game progression
        this.numbersSequence = [...CONFIG.NUMBERS_SEQUENCE];
        this.currentVoiceGender = 'boy';
        
        // Audio
        this.audioContext = null;
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
        
        // Event handlers
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        this.initializeGame();
    }

    async initializeGame() {
        this.findDOMElements();
        window.addEventListener('resize', this.handleResize);
        await this.initializeAudio();
        this.initializeRainbowSize();
        
        this.renderer = new TraceNumberRenderer();
        if (!this.renderer.initialize('traceContainer')) {
            console.error('Failed to initialize renderer');
            return;
        }
        
        this.pathManager = new TracePathManager(this.renderer.svg, this.renderer);
        await this.waitForDependencies();
        this.setupEventListeners();
        this.startNewNumber();
    }

    initializeRainbowSize() {
        const gameWidth = CONFIG.SVG_WIDTH;
        const appropriateRainbowWidth = gameWidth * 0.75;
        
        const originalInitialize = this.rainbow.initializeArcs.bind(this.rainbow);
        this.rainbow.initializeArcs = function() {
            this.container.innerHTML = '';
            const rainbowWidth = appropriateRainbowWidth;
            
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
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkDependencies = () => {
                attempts++;
                
                if (typeof CONFIG === 'undefined' || !this.renderer || !this.renderer.svg) {
                    if (attempts < maxAttempts) {
                        requestAnimationFrame(checkDependencies);
                        return;
                    }
                }
                
                resolve();
            };
            
            setTimeout(checkDependencies, 100);
        });
    }

    findDOMElements() {
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.numberWordDisplay = document.getElementById('numberWord');
        this.traceContainer = document.getElementById('traceContainer');
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
        
        this.setupRendererCallbacks();
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        document.addEventListener('keydown', (e) => {
            if (CONFIG.DEBUG_MODE) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.completeCurrentNumber();
                }
                if (e.key === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    this.startCurrentNumberOver();
                }
                if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    this.skipToNumber(parseInt(e.key));
                }
            }
        });
    }

    setupRendererCallbacks() {
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
    }

    handleResize() {
        if (this.renderer && this.renderer.svg) {
            this.renderer.updateSVGDimensions();
        }
        
        this.initializeRainbowSize();
        
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
        
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        
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
        
        if (!this.renderer.renderNumber(this.currentNumber)) {
            return;
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
        const pieces = this.rainbow.addPiece();
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
                        this.checkBalloonGameCompletion();
                    }
                );
            }, 500);
        } else {
            this.speechComplete = true;
        }
    }

    createBalloons() {
        const balloonCount = 12;
        const balloonWidth = 120;
        
        const positions = this.generateNonOverlappingPositions(balloonCount, balloonWidth);
        const numbers = [];
        
        // Add 3 correct numbers
        for (let i = 0; i < this.totalCorrectBalloons; i++) {
            numbers.push(this.currentNumber);
        }
        
        // Add 9 different random numbers
        const availableNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== this.currentNumber);
        for (let i = 0; i < 9; i++) {
            const randomNum = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            numbers.push(randomNum);
        }
        
        this.shuffleArray(numbers);
        
        for (let i = 0; i < balloonCount; i++) {
            const balloon = this.createBalloon(positions[i], numbers[i]);
            this.balloons.push(balloon);
        }
    }

    generateNonOverlappingPositions(count, width) {
        const positions = [];
        const margin = 20;
        const totalWidth = width + margin;
        
        const gameAreaWidth = CONFIG.SVG_WIDTH;
        const constrainedWidth = gameAreaWidth * 0.9;
        const availableWidth = constrainedWidth - width;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = startOffset + (Math.random() * availableWidth);
                attempts++;
            } while (this.hasOverlap(position, positions, totalWidth) && attempts < 50);
            
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
        const riseSpeed = 20 + Math.random() * 20;
        
        const gameAreaHeight = CONFIG.SVG_HEIGHT - 80;
        const lowerHalfStart = gameAreaHeight * 0.5;
        const randomStartHeight = lowerHalfStart + Math.random() * (gameAreaHeight * 0.3);
        
        const sidewaysSpeed = (Math.random() - 0.5) * 30;
        
        const balloonColors = [
            '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00',
            '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF'
        ];
        const balloonColor = balloonColors[Math.floor(Math.random() * balloonColors.length)];
        
        const numberWords = {
            0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
            5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
        };
        
        const balloon = {
            x: x,
            y: randomStartHeight,
            number: number,
            isCorrect: isCorrectNumber,
            riseSpeed: riseSpeed,
            sidewaysSpeed: sidewaysSpeed,
            sidewaysDirection: Math.sign(sidewaysSpeed) || 1,
            popped: false,
            color: balloonColor,
            group: null
        };
        
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        // Larger balloon (54px radius instead of 45px)
        const balloonRadius = 54;
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + balloonRadius);
        balloonCircle.setAttribute('cy', balloon.y + balloonRadius);
        balloonCircle.setAttribute('r', balloonRadius);
        balloonCircle.setAttribute('fill', balloonColor);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', 2);
        balloonCircle.setAttribute('class', 'balloon-circle');
        
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + balloonRadius - 17);
        highlight.setAttribute('cy', balloon.y + balloonRadius - 17);
        highlight.setAttribute('r', 14);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        highlight.setAttribute('class', 'balloon-highlight');
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        
        // Larger text (26px instead of 22px)
        const numberWord = numberWords[number];
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloonRadius);
        numberText.setAttribute('y', balloon.y + balloonRadius + 2);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '26');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('stroke', '#333');
        numberText.setAttribute('stroke-width', '1.4');
        numberText.setAttribute('class', 'balloon-number-word');
        numberText.textContent = numberWord;
        
        balloonGroup.appendChild(numberText);
        
        balloonGroup.addEventListener('click', () => this.popBalloon(balloon));
        balloonGroup.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.popBalloon(balloon);
        });
        
        balloon.group = balloonGroup;
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.textWord = numberText;
        balloon.radius = balloonRadius;
        
        this.renderer.svg.appendChild(balloonGroup);
        
        return balloon;
    }

    createBalloonString(balloon) {
        const balloonRadius = 54;
        const stringLength = 120;
        
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = balloon.x + balloonRadius;
        const startY = balloon.y + balloonRadius * 2;
        const endX = startX;
        const endY = startY + stringLength;
        
        const curve1X = startX + 18;
        const curve1Y = startY + stringLength * 0.25;
        const curve2X = startX - 18;
        const curve2Y = startY + stringLength * 0.5;
        const curve3X = startX + 12;
        const curve3Y = startY + stringLength * 0.75;
        
        const pathData = `M ${startX} ${startY} 
                         C ${startX + 6} ${startY + 12}, ${curve1X} ${curve1Y - 12}, ${curve1X} ${curve1Y}
                         C ${curve1X} ${curve1Y + 12}, ${curve2X} ${curve2Y - 12}, ${curve2X} ${curve2Y}
                         C ${curve2X} ${curve2Y + 12}, ${curve3X} ${curve3Y - 12}, ${curve3X} ${curve3Y}
                         C ${curve3X} ${curve3Y + 12}, ${endX - 6} ${endY - 12}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513');
        string.setAttribute('stroke-width', 3.5);
        string.setAttribute('fill', 'none');
        string.setAttribute('class', 'balloon-string-curly');
        
        // Store control points for animation
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        balloon.stringCurve1X = curve1X;
        balloon.stringCurve1Y = curve1Y;
        balloon.stringCurve2X = curve2X;
        balloon.stringCurve2Y = curve2Y;
        balloon.stringCurve3X = curve3X;
        balloon.stringCurve3Y = curve3Y;
        
        return string;
    }

    popBalloon(balloon) {
        if (balloon.popped || !this.playingBalloonGame) return;
        
        balloon.popped = true;
        
        // Yellow star pop effect at balloon center
        this.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            this.correctBalloonsFound++;
            
            if (this.audioEnabled) {
                this.playCompletionSound();
            }
            
            this.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            
            if (this.audioEnabled) {
                const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                setTimeout(() => {
                    this.speakText(randomEncouragement, this.currentVoiceGender);
                }, 200);
            }
        } else {
            // Play failure sound for incorrect balloons
            if (this.audioEnabled) {
                this.playFailureSound();
            }
        }
        
        if (balloon.group) {
            balloon.group.remove();
        }
        
        this.checkBalloonGameCompletion();
    }

    createPopEffect(x, y) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x);
        star.setAttribute('y', y);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('dominant-baseline', 'middle');
        star.setAttribute('font-size', '40');
        star.setAttribute('fill', '#FFD700');
        star.setAttribute('class', 'pop-star');
        star.textContent = '⭐';
        
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'scale');
        animate.setAttribute('values', '0;1.5;1');
        animate.setAttribute('dur', '0.6s');
        animate.setAttribute('fill', 'freeze');
        
        const fadeOut = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        fadeOut.setAttribute('attributeName', 'opacity');
        fadeOut.setAttribute('values', '1;1;0');
        fadeOut.setAttribute('dur', '0.6s');
        fadeOut.setAttribute('fill', 'freeze');
        
        star.appendChild(animate);
        star.appendChild(fadeOut);
        
        this.renderer.svg.appendChild(star);
        
        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 600);
    }

    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = CONFIG.SVG_HEIGHT;
        const grassBandTop = gameAreaHeight - grassBandHeight;
        
        // Random landing position within 40% to 80% of grass band height from bottom
        const minHeightFromTop = grassBandHeight * 0.2; // 80% from bottom
        const maxHeightFromTop = grassBandHeight * 0.6; // 40% from bottom
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        // Doubled falling speed (180 px/s instead of 90)
        const fallingSpeed = 180;
        
        const fallingNumber = {
            x: x,
            startX: x,
            y: y,
            targetY: targetY,
            number: number,
            speed: fallingSpeed,
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
        
        // Update balloons
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                balloon.y -= balloon.riseSpeed * deltaTime;
                
                // Check ceiling collision
                if (balloon.y <= 0) {
                    this.popBalloon(balloon);
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
                    
                    const newStartX = currentStartX;
                    const newStartY = currentStartY;
                    const newEndX = balloon.stringEndX + deltaX;
                    const newEndY = balloon.stringEndY + deltaY;
                    const newCurve1X = balloon.stringCurve1X + deltaX;
                    const newCurve1Y = balloon.stringCurve1Y + deltaY;
                    const newCurve2X = balloon.stringCurve2X + deltaX;
                    const newCurve2Y = balloon.stringCurve2Y + deltaY;
                    const newCurve3X = balloon.stringCurve3X + deltaX;
                    const newCurve3Y = balloon.stringCurve3Y + deltaY;
                    
                    const pathData = `M ${newStartX} ${newStartY} 
                                     C ${newStartX + 6} ${newStartY + 12}, ${newCurve1X} ${newCurve1Y - 12}, ${newCurve1X} ${newCurve1Y}
                                     C ${newCurve1X} ${newCurve1Y + 12}, ${newCurve2X} ${newCurve2Y - 12}, ${newCurve2X} ${newCurve2Y}
                                     C ${newCurve2X} ${newCurve2Y + 12}, ${newCurve3X} ${newCurve3Y - 12}, ${newCurve3X} ${newCurve3Y}
                                     C ${newCurve3X} ${newCurve3Y + 12}, ${newEndX - 6} ${newEndY - 12}, ${newEndX} ${newEndY}`;
                    
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
                    
                    // Check if all numbers have landed
                    const allLanded = this.fallingNumbers.every(fn => fn.landed);
                    if (allLanded && !this.numbersLanded) {
                        this.numbersLanded = true;
                        this.checkBalloonGameCompletion();
                    }
                }
                
                if (fallingNumber.element) {
                    fallingNumber.element.setAttribute('y', fallingNumber.y);
                }
            }
        });
        
        // Check if all balloons are gone
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        if (activeBalloonsCount === 0) {
            this.checkBalloonGameCompletion();
            return;
        }
        
        this.balloonAnimationId = requestAnimationFrame((time) => this.animateBalloons(time));
    }

    checkBalloonGameCompletion() {
        const activeBalloonsCount = this.balloons.filter(b => !b.popped).length;
        const hasFoundEnoughCorrect = this.correctBalloonsFound >= this.totalCorrectBalloons;
        const allBalloonsGone = activeBalloonsCount === 0;
        
        // Complete when conditions are met AND both speech and numbers are done
        if ((hasFoundEnoughCorrect || allBalloonsGone) && this.speechComplete && this.numbersLanded) {
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
        const elementsToRemove = this.renderer.svg.querySelectorAll(
            '.balloon-group, .falling-number-static, .pop-star'
        );
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
        
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
        
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
                let selectedVoice = null;
                
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('male')
                    );
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('child') ||
                        voice.name.toLowerCase().includes('female')
                    );
                }
                
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('female') ||
                        voice.gender === 'female'
                    );
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
                
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
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
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                
                if (callback) {
                    utterance.onend = callback;
                    utterance.onerror = callback;
                }
                
                const voices = speechSynthesis.getVoices();
                let selectedVoice = null;
                
                if (preferredGender === 'boy') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('boy') ||
                        voice.name.toLowerCase().includes('male')
                    );
                } else if (preferredGender === 'girl') {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('girl') ||
                        voice.name.toLowerCase().includes('female')
                    );
                }
                
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => 
                        voice.name.toLowerCase().includes('female') ||
                        voice.gender === 'female'
                    );
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
                
                if (preferredGender === 'boy') {
                    utterance.pitch = 1.3;
                    utterance.rate = 0.9;
                } else if (preferredGender === 'girl') {
                    utterance.pitch = 1.4;
                    utterance.rate = 0.9;
                }
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.warn('Speech synthesis failed:', error);
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
            if ('speechSynthesis' in window) {
                speechSynthesis.pause();
            }
        } else {
            if ('speechSynthesis' in window) {
                speechSynthesis.resume();
            }
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

    // DEBUG METHODS
    skipToNumber(number) {
        if (!CONFIG.DEBUG_MODE) return;
        
        const index = this.numbersSequence.indexOf(number);
        if (index !== -1) {
            this.currentNumberIndex = index;
            this.startNewNumber();
        }
    }

    completeCurrentNumber() {
        if (!CONFIG.DEBUG_MODE) return;
        this.renderer.completeNumber();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
    }

    // CLEANUP
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.pathManager) {
            this.pathManager.cleanup();
        }
        
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
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('visibilitychange', () => {
        if (window.traceGame) {
            window.traceGame.handleVisibilityChange();
        }
    });
    
    window.traceGame = new TraceGameController();
});

window.addEventListener('beforeunload', () => {
    if (window.traceGame) {
        window.traceGame.destroy();
    }
});
