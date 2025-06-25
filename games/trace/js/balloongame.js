class BalloonGame {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Simple game state - only what's needed for balloon mini-game
        this.isActive = false;
        this.correctNumber = null;
        this.balloons = [];
        this.fallingNumber = null;
        this.onComplete = null; // Callback to controller when mini-game done
        
        // Animation
        this.animationId = null;
        this.startTime = null;
        
        // Balloon configuration - using your original values
        this.balloonCount = 3;
        this.balloonWidth = 80;
        this.balloonHeight = 100;
        this.balloonSpeed = { min: 40, max: 60 };
        this.floatAmplitude = 25;
        this.floatFrequency = 0.001;
        
        // Game area bounds - using your CONFIG references
        this.gameTop = 50;
        this.gameBottom = CONFIG.SVG_HEIGHT - 100;
        this.gameLeft = 50;
        this.gameRight = CONFIG.SVG_WIDTH - 50;
        
        console.log('BalloonGame mini-game component initialized');
    }

    // ONLY responsibility: start the balloon mini-game
    startGame(correctNumber, onCompleteCallback) {
        if (this.isActive) {
            console.log('Balloon mini-game already active');
            return;
        }
        
        console.log('Starting balloon mini-game for number:', correctNumber);
        
        this.correctNumber = correctNumber;
        this.onComplete = onCompleteCallback;
        this.isActive = true;
        this.fallingNumber = null;
        
        // Clean up any existing balloons
        this.cleanup();
        
        // Create the balloon mini-game
        this.createBalloons();
        
        // Start animation
        this.startTime = Date.now();
        this.animate();
    }

    createBalloons() {
        this.balloons = [];
        
        // Generate 3 different numbers, one correct
        const numbers = this.generateBalloonNumbers();
        const positions = this.generateRandomPositions();
        
        for (let i = 0; i < this.balloonCount; i++) {
            const x = positions[i].x;
            const y = positions[i].y;
            const number = numbers[i];
            const isCorrect = number === this.correctNumber;
            const speed = this.balloonSpeed.min + Math.random() * (this.balloonSpeed.max - this.balloonSpeed.min);
            
            const balloon = this.createBalloon(x, y, number, isCorrect, i, speed);
            this.balloons.push(balloon);
        }
        
        console.log('Created balloons with numbers:', numbers);
    }

    generateBalloonNumbers() {
        const numbers = [this.correctNumber];
        
        // Add 2 different random numbers
        while (numbers.length < 3) {
            const randomNum = Math.floor(Math.random() * 10);
            if (!numbers.includes(randomNum)) {
                numbers.push(randomNum);
            }
        }
        
        // Shuffle array
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        return numbers;
    }

    generateRandomPositions() {
        const positions = [];
        const minDistance = this.balloonWidth + 20;
        
        for (let i = 0; i < this.balloonCount; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = {
                    x: this.gameLeft + Math.random() * (this.gameRight - this.gameLeft - this.balloonWidth),
                    y: this.gameBottom - 50 - Math.random() * 100
                };
                attempts++;
            } while (attempts < 50 && this.isPositionTooClose(position, positions, minDistance));
            
            positions.push(position);
        }
        
        return positions;
    }

    isPositionTooClose(newPos, existingPositions, minDistance) {
        return existingPositions.some(pos => {
            const distance = Math.sqrt(
                Math.pow(newPos.x - pos.x, 2) + Math.pow(newPos.y - pos.y, 2)
            );
            return distance < minDistance;
        });
    }

    createBalloon(x, y, number, isCorrect, index, speed) {
        // Create balloon group
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', `balloon-${index}`);
        balloonGroup.setAttribute('transform', `translate(${x}, ${y})`);
        balloonGroup.style.cursor = 'pointer';
        
        // Balloon body
        const balloonBody = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        balloonBody.setAttribute('cx', this.balloonWidth / 2);
        balloonBody.setAttribute('cy', this.balloonHeight / 2);
        balloonBody.setAttribute('rx', this.balloonWidth / 2 - 5);
        balloonBody.setAttribute('ry', this.balloonHeight / 2 - 5);
        balloonBody.setAttribute('fill', this.getBalloonColor(index));
        balloonBody.setAttribute('stroke', 'white');
        balloonBody.setAttribute('stroke-width', 3);
        balloonBody.setAttribute('filter', 'drop-shadow(3px 3px 6px rgba(0,0,0,0.3))');
        
        // Balloon string
        const stringPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const stringLength = 40;
        const stringStartX = this.balloonWidth / 2;
        const stringStartY = this.balloonHeight - 5;
        
        const pathData = `M ${stringStartX} ${stringStartY} 
                         Q ${stringStartX - 8} ${stringStartY + 10} ${stringStartX + 4} ${stringStartY + 20}
                         Q ${stringStartX + 12} ${stringStartY + 30} ${stringStartX - 2} ${stringStartY + stringLength}`;
        
        stringPath.setAttribute('d', pathData);
        stringPath.setAttribute('stroke', '#333');
        stringPath.setAttribute('stroke-width', 2);
        stringPath.setAttribute('fill', 'none');
        stringPath.setAttribute('class', 'balloon-string');
        
        // Animate string
        const animateString = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateString.setAttribute('attributeName', 'transform');
        animateString.setAttribute('type', 'rotate');
        animateString.setAttribute('values', '-3 40 85; 3 40 85; -3 40 85');
        animateString.setAttribute('dur', `${2 + Math.random()}s`);
        animateString.setAttribute('repeatCount', 'indefinite');
        stringPath.appendChild(animateString);
        
        // Number text (word version) - using your CONFIG reference
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', this.balloonWidth / 2);
        numberText.setAttribute('y', this.balloonHeight / 2 + 10);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '28');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.setAttribute('pointer-events', 'none');
        numberText.textContent = CONFIG.NUMBER_WORDS[number];
        
        balloonGroup.appendChild(balloonBody);
        balloonGroup.appendChild(stringPath);
        balloonGroup.appendChild(numberText);
        
        // Click handler
        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.handleBalloonClick(index, isCorrect);
        };
        
        balloonGroup.addEventListener('click', clickHandler);
        balloonGroup.addEventListener('touchstart', clickHandler);
        
        this.svg.appendChild(balloonGroup);
        
        return {
            element: balloonGroup,
            x: x,
            y: y,
            originalY: y,
            number: number,
            isCorrect: isCorrect,
            isPopped: false,
            floatOffset: Math.random() * Math.PI * 2,
            speed: speed,
            clickHandler: clickHandler
        };
    }

    getBalloonColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[index % colors.length];
    }

    handleBalloonClick(index, isCorrect) {
        if (!this.isActive || this.balloons[index].isPopped) {
            return;
        }
        
        console.log(`Balloon ${index} clicked! Correct: ${isCorrect}`);
        
        if (isCorrect) {
            this.handleCorrectBalloon(index);
        } else {
            this.handleWrongBalloon(index);
        }
    }

    handleCorrectBalloon(index) {
        const balloon = this.balloons[index];
        
        // Create falling number before popping balloon
        this.createFallingNumber(balloon.x + this.balloonWidth / 2, balloon.y + this.balloonHeight / 2);
        
        // Pop the balloon
        this.popBalloon(index);
        
        // Speak the number using the game controller's voice gender (maintained compatibility)
        if (window.traceGame && window.traceGame.audioEnabled) {
            setTimeout(() => {
                window.traceGame.speakText(CONFIG.NUMBER_WORDS[this.correctNumber], window.traceGame.currentVoiceGender);
            }, 300);
        }
        
        // SIMPLE: Just finish the mini-game after showing animation
        setTimeout(() => {
            this.finishMiniGame();
        }, 2000);
        
        console.log('Correct balloon clicked! Mini-game will finish after animation.');
    }

    handleWrongBalloon(index) {
        // Just pop the wrong balloon
        this.popBalloon(index);
        console.log('Wrong balloon popped');
    }

    popBalloon(index) {
        const balloon = this.balloons[index];
        if (balloon.isPopped) return;
        
        balloon.isPopped = true;
        
        // Get balloon center for pop effect
        const transform = balloon.element.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        let balloonCenterX, balloonCenterY;
        
        if (match) {
            balloonCenterX = parseFloat(match[1]) + this.balloonWidth / 2;
            balloonCenterY = parseFloat(match[2]) + this.balloonHeight / 2;
        } else {
            balloonCenterX = balloon.x + this.balloonWidth / 2;
            balloonCenterY = balloon.y + this.balloonHeight / 2;
        }
        
        // Create pop effect
        const popEffect = this.createPopEffect(balloonCenterX, balloonCenterY);
        
        // Remove balloon
        if (balloon.element && balloon.element.parentNode) {
            balloon.element.remove();
        }
        
        // Clean up pop effect
        setTimeout(() => {
            if (popEffect && popEffect.parentNode) {
                popEffect.remove();
            }
        }, 500);
    }

    createPopEffect(x, y) {
        const popGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        popGroup.setAttribute('transform', `translate(${x}, ${y})`);
        popGroup.setAttribute('class', 'pop-effect');
        
        // Create burst effect
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', Math.cos(angle) * 30);
            line.setAttribute('y2', Math.sin(angle) * 30);
            line.setAttribute('stroke', '#FFD700');
            line.setAttribute('stroke-width', 4);
            line.setAttribute('stroke-linecap', 'round');
            
            // Animate burst
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'stroke-width');
            animate.setAttribute('values', '4;0');
            animate.setAttribute('dur', '0.5s');
            
            const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateOpacity.setAttribute('attributeName', 'opacity');
            animateOpacity.setAttribute('values', '1;0');
            animateOpacity.setAttribute('dur', '0.5s');
            
            line.appendChild(animate);
            line.appendChild(animateOpacity);
            popGroup.appendChild(line);
        }
        
        this.svg.appendChild(popGroup);
        return popGroup;
    }

    createFallingNumber(x, y) {
        this.fallingNumber = {
            x: x,
            y: y,
            element: null,
            fallSpeed: 120,
            hasReachedBottom: false
        };
        
        // Create falling number element
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('transform', `translate(${x}, ${y})`);
        numberGroup.setAttribute('class', 'falling-number');
        
        // Background circle - using your CONFIG reference
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        background.setAttribute('cx', 0);
        background.setAttribute('cy', 0);
        background.setAttribute('r', 35);
        background.setAttribute('fill', CONFIG.FILL_COLOR);
        background.setAttribute('stroke', 'white');
        background.setAttribute('stroke-width', 4);
        background.setAttribute('filter', 'drop-shadow(3px 3px 8px rgba(0,0,0,0.4))');
        
        // Number text (digit version)
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', 0);
        numberText.setAttribute('y', 12);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '42');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', 'white');
        numberText.textContent = this.correctNumber;
        
        numberGroup.appendChild(background);
        numberGroup.appendChild(numberText);
        
        this.svg.appendChild(numberGroup);
        this.fallingNumber.element = numberGroup;
        
        console.log(`Created falling number ${this.correctNumber}`);
    }

    animate() {
        if (!this.isActive) {
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.startTime;
        
        // Update balloons
        this.updateBalloons(deltaTime);
        
        // Update falling number
        this.updateFallingNumber(deltaTime);
        
        // Continue animation
        if (this.isActive) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    updateBalloons(totalTime) {
        this.balloons.forEach((balloon, index) => {
            if (balloon.isPopped) return;
            
            // Animate balloon movement
            const balloonTime = totalTime;
            const verticalProgress = balloon.speed * balloonTime / 1000;
            const newY = balloon.originalY - verticalProgress;
            
            // Horizontal drift
            const timeInSeconds = balloonTime / 1000;
            const driftX = Math.sin((timeInSeconds * this.floatFrequency) + balloon.floatOffset) * this.floatAmplitude;
            const newX = balloon.x + driftX;
            
            // Update position
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.setAttribute('transform', `translate(${newX}, ${newY})`);
            }
            
            // Check if balloon reached top
            if (newY + this.balloonHeight < this.gameTop) {
                if (balloon.isCorrect) {
                    // Correct balloon escaped - treat as correct answer
                    this.handleCorrectBalloon(index);
                } else {
                    // Wrong balloon escaped - just pop it
                    this.popBalloon(index);
                }
            }
        });
    }

    updateFallingNumber(totalTime) {
        if (!this.fallingNumber || !this.fallingNumber.element) return;
        
        const fallTime = totalTime / 1000;
        const newY = this.fallingNumber.y + (this.fallingNumber.fallSpeed * fallTime);
        
        // Update position
        if (newY >= this.gameBottom - 50) {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${this.gameBottom - 50})`);
            this.fallingNumber.hasReachedBottom = true;
        } else {
            this.fallingNumber.element.setAttribute('transform', `translate(${this.fallingNumber.x}, ${newY})`);
        }
    }

    // SIMPLE: Just end this mini-game and call controller
    finishMiniGame() {
        if (!this.isActive) {
            return;
        }
        
        console.log('Balloon mini-game finished!');
        this.isActive = false;
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clean up after short delay to show final state
        setTimeout(() => {
            this.cleanup();
            
            // ONLY responsibility: tell controller we're done
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1000);
    }

    cleanup() {
        // Remove all balloon elements
        this.balloons.forEach(balloon => {
            if (balloon.element && balloon.element.parentNode) {
                balloon.element.remove();
            }
        });
        
        // Remove falling number
        if (this.fallingNumber && this.fallingNumber.element && this.fallingNumber.element.parentNode) {
            this.fallingNumber.element.remove();
        }
        
        // Remove pop effects
        const popEffects = this.svg.querySelectorAll('.pop-effect');
        popEffects.forEach(effect => effect.remove());
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.balloons = [];
        this.fallingNumber = null;
        
        console.log('Balloon mini-game cleanup completed');
    }

    reset() {
        this.cleanup();
        this.correctNumber = null;
        this.onComplete = null;
        this.isActive = false;
    }
}

// Make available globally
window.BalloonGame = BalloonGame;
