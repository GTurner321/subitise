class BalloonRenderer {
    constructor() {
        this.container = document.getElementById('balloonContainer');
        this.svg = null;
        this.balloons = [];
        this.fallingNumbers = [];
        this.trafficLightContainer = null;
        this.trafficLights = [];
        
        // Responsive dimensions (all based on viewport height)
        this.dimensions = {
            balloonDiameter: 0,
            balloonRadius: 0,
            stringHeight: 0,
            balloonTextSize: 0,
            lozengeTextSize: 0,
            grassBandHeight: 0
        };
        
        this.animationId = null;
        this.lastTime = 0;
    }
    
    async initialize() {
        console.log('🎨 Initializing Balloon Renderer');
        
        this.calculateResponsiveDimensions();
        this.createSVG();
        this.createTrafficLight();
        this.setupEventListeners();
        
        console.log('✅ Balloon Renderer initialized', this.dimensions);
    }
    
    calculateResponsiveDimensions() {
        const screenHeight = window.innerHeight;
        
        this.dimensions = {
            // All dimensions responsive to screen height
            balloonDiameter: screenHeight * 0.08, // 8vh
            balloonRadius: screenHeight * 0.04,   // 4vh (half diameter)
            stringHeight: screenHeight * 0.16,    // 16vh (2x diameter)
            grassBandHeight: screenHeight * 0.10,  // 10vh
            balloonTextSize: screenHeight * 0.032, // ~4vh (fits in balloon)
            lozengeTextSize: screenHeight * 0.016  // 2vh (half balloon text)
        };
        
        console.log('📏 Calculated responsive dimensions:', this.dimensions);
    }
    
    handleResize() {
        console.log('🔄 Handling resize in renderer');
        
        this.calculateResponsiveDimensions();
        this.updateSVGDimensions();
        this.repositionTrafficLight();
        
        // Update existing balloons if any
        this.balloons.forEach(balloon => {
            this.updateBalloonDisplay(balloon);
        });
        
        // Update existing falling numbers if any
        this.fallingNumbers.forEach(fallingNumber => {
            this.updateFallingNumberDisplay(fallingNumber);
        });
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
            const gameWidth = window.innerWidth;
            const gameHeight = window.innerHeight;
            
            this.svg.setAttribute('viewBox', `0 0 ${gameWidth} ${gameHeight}`);
            this.svg.setAttribute('width', '100%');
            this.svg.setAttribute('height', '100%');
        }
    }
    
    createTrafficLight() {
        // Remove existing traffic light
        if (this.trafficLightContainer && this.trafficLightContainer.parentNode) {
            this.trafficLightContainer.parentNode.removeChild(this.trafficLightContainer);
        }
        
        this.trafficLightContainer = document.createElement('div');
        this.repositionTrafficLight();
        
        // Create traffic lights (need 8 for correct balloons)
        this.trafficLights = [];
        for (let i = 0; i < BALLOON_CONFIG.CORRECT_BALLOONS; i++) {
            const light = document.createElement('div');
            light.style.cssText = `
                width: 2.5vh; 
                height: 2.5vh; 
                border-radius: 50%; 
                background: #333;
                border: 0.2vh solid #555; 
                transition: all 0.3s ease;
                margin-bottom: 0.8vh;
            `;
            
            this.trafficLights.push(light);
            this.trafficLightContainer.appendChild(light);
        }
        
        document.body.appendChild(this.trafficLightContainer);
    }
    
    repositionTrafficLight() {
        if (this.trafficLightContainer) {
            this.trafficLightContainer.style.cssText = `
                position: fixed; 
                top: 50%; 
                right: 2vh; 
                transform: translateY(-50%); 
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8); 
                border-radius: 2vh; 
                padding: 1.5vh 1vh;
                display: flex; 
                flex-direction: column; 
                align-items: center;
                box-shadow: 0 0.4vh 1.2vh rgba(0, 0, 0, 0.3);
            `;
        }
    }
    
    updateTrafficLight(balloonPopOrder) {
        // Update traffic lights based on order of balloon pops
        this.trafficLights.forEach((light, index) => {
            if (index < balloonPopOrder.length) {
                const wasUserPopped = balloonPopOrder[index];
                if (wasUserPopped) {
                    // Green for user-popped balloons
                    light.style.backgroundColor = '#4CAF50';
                    light.style.boxShadow = '0 0 1vh rgba(76, 175, 80, 0.8)';
                } else {
                    // Grey for ceiling-hit balloons
                    light.style.backgroundColor = '#808080';
                    light.style.boxShadow = '0 0 1vh rgba(128, 128, 128, 0.8)';
                }
            } else {
                // Dark for not processed
                light.style.backgroundColor = '#333';
                light.style.boxShadow = 'none';
            }
        });
    }
    
    resetTrafficLight() {
        // Reset all traffic lights to dark
        this.trafficLights.forEach(light => {
            light.style.backgroundColor = '#333';
            light.style.boxShadow = 'none';
        });
    }
    
    setupEventListeners() {
        // No specific event listeners needed - balloons will handle their own clicks
    }
    
    spawnBalloons(balloonConfigs) {
        console.log(`🎈 Spawning ${balloonConfigs.length} balloons`);
        
        this.clearBalloons();
        
        balloonConfigs.forEach((config) => {
            this.createBalloon(config);
        });
        
        // Fade in all balloons over 2 seconds
        setTimeout(() => {
            this.balloons.forEach(balloon => {
                if (balloon.group) {
                    balloon.group.style.transition = 'opacity 2s ease-in';
                    balloon.group.style.opacity = '1';
                }
            });
        }, 100);
        
        // Start animation loop
        this.startAnimationLoop();
    }
    
    createBalloon(config) {
        const { number, isCorrect } = config;
        
        // Generate random position with better distribution
        const gameAreaWidth = window.innerWidth;
        const constrainedWidth = gameAreaWidth * 0.9;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2;
        const x = startOffset + (Math.random() * (constrainedWidth - this.dimensions.balloonDiameter));
        
        // Use responsive height positioning
        const gameAreaHeight = window.innerHeight;
        const minStartHeight = gameAreaHeight * 0.55; // Start higher up
        const maxStartHeight = gameAreaHeight * 0.85;
        const y = minStartHeight + Math.random() * (maxStartHeight - minStartHeight);
        
        const balloon = {
            x: x,
            y: y,
            number: number,
            isCorrect: isCorrect,
            popped: false,
            color: BALLOON_CONFIG.BALLOON_COLORS[Math.floor(Math.random() * BALLOON_CONFIG.BALLOON_COLORS.length)],
            // Physics properties will be set by BalloonPhysics
        };
        
        // Create balloon visual elements
        const balloonGroup = this.createBalloonVisuals(balloon);
        balloon.group = balloonGroup;
        
        this.svg.appendChild(balloonGroup);
        this.balloons.push(balloon);
        
        return balloon;
    }
    
    createBalloonVisuals(balloon) {
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        balloonGroup.style.opacity = '0';
        
        // Balloon string - responsive height
        const string = this.createBalloonString(balloon);
        balloonGroup.appendChild(string);
        
        // Balloon circle
        const balloonCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        balloonCircle.setAttribute('cx', balloon.x + this.dimensions.balloonRadius);
        balloonCircle.setAttribute('cy', balloon.y + this.dimensions.balloonRadius);
        balloonCircle.setAttribute('r', this.dimensions.balloonRadius);
        balloonCircle.setAttribute('fill', balloon.color);
        balloonCircle.setAttribute('stroke', '#333');
        balloonCircle.setAttribute('stroke-width', '2');
        
        // Highlight - responsive sizing
        const highlightRadius = this.dimensions.balloonRadius * 0.35; // 35% of balloon radius
        const highlightOffset = this.dimensions.balloonRadius * 0.4; // 40% offset
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', balloon.x + this.dimensions.balloonRadius - highlightOffset);
        highlight.setAttribute('cy', balloon.y + this.dimensions.balloonRadius - highlightOffset);
        highlight.setAttribute('r', highlightRadius);
        highlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        
        // Number text - responsive sizing
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + this.dimensions.balloonRadius);
        numberText.setAttribute('y', balloon.y + this.dimensions.balloonRadius + (this.dimensions.balloonTextSize * 0.1));
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', this.dimensions.balloonTextSize);
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', '#000000');
        numberText.textContent = balloon.number.toString();
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        balloonGroup.appendChild(numberText);
        
        // Store element references
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.text = numberText;
        
        // Event listeners
        balloonGroup.addEventListener('click', () => this.popBalloon(balloon, true));
        balloonGroup.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.popBalloon(balloon, true); 
        });
        
        return balloonGroup;
    }
    
    createBalloonString(balloon) {
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = balloon.x + this.dimensions.balloonRadius;
        const startY = balloon.y + this.dimensions.balloonDiameter;
        const endX = startX;
        const endY = startY + this.dimensions.stringHeight;
        
        // Create a wavy string path - responsive to string height
        const waveHeight = this.dimensions.stringHeight * 0.15; // 15% of string height for waves
        const waveWidth = this.dimensions.balloonRadius * 0.4; // 40% of balloon radius for wave width
        
        const pathData = `M ${startX} ${startY} 
                         C ${startX + waveWidth} ${startY + waveHeight}, ${startX + waveWidth * 1.5} ${startY + waveHeight * 1.5}, ${startX + waveWidth * 1.5} ${startY + waveHeight * 2}
                         C ${startX + waveWidth * 1.5} ${startY + waveHeight * 2.8}, ${startX - waveWidth * 1.5} ${startY + waveHeight * 3.2}, ${startX - waveWidth * 1.5} ${startY + waveHeight * 4}
                         C ${startX - waveWidth * 1.5} ${startY + waveHeight * 4.8}, ${startX + waveWidth} ${startY + waveHeight * 5.2}, ${startX + waveWidth} ${startY + waveHeight * 6}
                         C ${startX + waveWidth} ${startY + waveHeight * 6.8}, ${endX - waveWidth * 0.5} ${endY - waveHeight * 0.8}, ${endX} ${endY}`;
        
        string.setAttribute('d', pathData);
        string.setAttribute('stroke', '#8B4513');
        string.setAttribute('stroke-width', '3.5');
        string.setAttribute('fill', 'none');
        
        // Store string coordinates for updates
        balloon.stringStartX = startX;
        balloon.stringStartY = startY;
        balloon.stringEndX = endX;
        balloon.stringEndY = endY;
        
        return string;
    }
    
    updateBalloonDisplay(balloon) {
        if (!balloon.group || balloon.popped) return;
        
        // Update all visual elements to new position
        if (balloon.circle) {
            balloon.circle.setAttribute('cx', balloon.x + this.dimensions.balloonRadius);
            balloon.circle.setAttribute('cy', balloon.y + this.dimensions.balloonRadius);
            balloon.circle.setAttribute('r', this.dimensions.balloonRadius);
        }
        
        if (balloon.highlight) {
            const highlightOffset = this.dimensions.balloonRadius * 0.4;
            balloon.highlight.setAttribute('cx', balloon.x + this.dimensions.balloonRadius - highlightOffset);
            balloon.highlight.setAttribute('cy', balloon.y + this.dimensions.balloonRadius - highlightOffset);
            balloon.highlight.setAttribute('r', this.dimensions.balloonRadius * 0.35);
        }
        
        if (balloon.text) {
            balloon.text.setAttribute('x', balloon.x + this.dimensions.balloonRadius);
            balloon.text.setAttribute('y', balloon.y + this.dimensions.balloonRadius + (this.dimensions.balloonTextSize * 0.1));
            balloon.text.setAttribute('font-size', this.dimensions.balloonTextSize);
        }
        
        // Update string
        if (balloon.string) {
            this.updateBalloonString(balloon);
        }
    }
    
    updateBalloonString(balloon) {
        const currentStartX = balloon.x + this.dimensions.balloonRadius;
        const currentStartY = balloon.y + this.dimensions.balloonDiameter;
        const deltaX = currentStartX - balloon.stringStartX;
        const deltaY = currentStartY - balloon.stringStartY;
        const newEndX = balloon.stringEndX + deltaX;
        const newEndY = balloon.stringEndY + deltaY;
        
        // Update wave parameters
        const waveHeight = this.dimensions.stringHeight * 0.15;
        const waveWidth = this.dimensions.balloonRadius * 0.4;
        
        const pathData = `M ${currentStartX} ${currentStartY} 
                         C ${currentStartX + waveWidth} ${currentStartY + waveHeight}, ${currentStartX + waveWidth * 1.5} ${currentStartY + waveHeight * 1.5}, ${currentStartX + waveWidth * 1.5} ${currentStartY + waveHeight * 2}
                         C ${currentStartX + waveWidth * 1.5} ${currentStartY + waveHeight * 2.8}, ${currentStartX - waveWidth * 1.5} ${currentStartY + waveHeight * 3.2}, ${currentStartX - waveWidth * 1.5} ${currentStartY + waveHeight * 4}
                         C ${currentStartX - waveWidth * 1.5} ${currentStartY + waveHeight * 4.8}, ${currentStartX + waveWidth} ${currentStartY + waveHeight * 5.2}, ${currentStartX + waveWidth} ${currentStartY + waveHeight * 6}
                         C ${currentStartX + waveWidth} ${currentStartY + waveHeight * 6.8}, ${newEndX - waveWidth * 0.5} ${newEndY - waveHeight * 0.8}, ${newEndX} ${newEndY}`;
        
        balloon.string.setAttribute('d', pathData);
    }
    
    popBalloon(balloon, poppedByUser = true) {
        if (balloon.popped) return;
        balloon.popped = true;
        
        console.log(`💥 Balloon ${balloon.number} popped by ${poppedByUser ? 'user' : 'ceiling'}`);
        
        // Create pop effect
        this.createPopEffect(balloon.x + this.dimensions.balloonRadius, balloon.y + this.dimensions.balloonRadius);
        
        // Create falling number if correct
        if (balloon.isCorrect) {
            this.createFallingNumber(
                balloon.x + this.dimensions.balloonRadius, 
                balloon.y + this.dimensions.balloonRadius, 
                balloon.number
            );
        }
        
        // Remove balloon visuals
        if (balloon.group) {
            balloon.group.remove();
        }
        
        // Remove balloon from array
        const index = this.balloons.indexOf(balloon);
        if (index > -1) {
            this.balloons.splice(index, 1);
        }
        
        // Dispatch event for game controller
        const popEvent = new CustomEvent('balloonPopped', {
            detail: { balloon, poppedByUser }
        });
        document.dispatchEvent(popEvent);
    }
    
    createPopEffect(x, y) {
        // Simple responsive pop effect - expanding circle that fades out
        const popEffect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        popEffect.setAttribute('cx', x);
        popEffect.setAttribute('cy', y);
        popEffect.setAttribute('r', this.dimensions.balloonRadius * 0.1);
        popEffect.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
        popEffect.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
        popEffect.setAttribute('stroke-width', '2');
        
        this.svg.appendChild(popEffect);
        
        // Animate the pop effect
        let startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / 300, 1); // 300ms animation
            
            const radius = (this.dimensions.balloonRadius * 0.1) + (progress * this.dimensions.balloonRadius * 0.6);
            const opacity = 1 - progress;
            
            popEffect.setAttribute('r', radius);
            popEffect.setAttribute('fill', `rgba(255, 255, 255, ${opacity * 0.8})`);
            popEffect.setAttribute('stroke', `rgba(255, 255, 255, ${opacity * 0.6})`);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                popEffect.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createFallingNumber(x, y, number) {
        // Calculate target position in grass band
        const grassBandTop = window.innerHeight - this.dimensions.grassBandHeight;
        const minHeightFromTop = this.dimensions.grassBandHeight * 0.2;
        const maxHeightFromTop = this.dimensions.grassBandHeight * 0.6;
        const randomHeightFromTop = minHeightFromTop + Math.random() * (maxHeightFromTop - minHeightFromTop);
        const targetY = grassBandTop + randomHeightFromTop;
        
        const fallingNumber = {
            x: x,
            y: y,
            targetY: targetY,
            number: number,
            speed: BALLOON_CONFIG.FALLING_NUMBER_SPEED,
            element: null,
            landed: false,
            landedTime: 0
        };
        
        // Get text for lozenge
        const textContent = BALLOON_CONFIG.NUMBER_TO_WORD[number] || number.toString();
        
        // Calculate responsive lozenge dimensions
        const charWidth = this.dimensions.lozengeTextSize * 0.75; // Responsive char width
        const padding = this.dimensions.lozengeTextSize * 1.25; // Responsive padding
        const rectWidth = Math.max(this.dimensions.balloonRadius * 2, textContent.length * charWidth + padding);
        const rectHeight = this.dimensions.lozengeTextSize * 1.875; // 1.875 ratio for height
        
        // Create group for rectangle background and text
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('class', 'falling-number-group');
        
        // Create rounded rectangle background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - rectWidth/2);
        rect.setAttribute('y', y - rectHeight/2);
        rect.setAttribute('width', rectWidth);
        rect.setAttribute('height', rectHeight);
        rect.setAttribute('rx', rectHeight * 0.5); // Fully rounded ends
        rect.setAttribute('ry', rectHeight * 0.5);
        rect.setAttribute('fill', '#add8e6');
        rect.setAttribute('stroke', '#4682b4');
        rect.setAttribute('stroke-width', '2');
        
        // Create text element with word version of number
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', x);
        numberElement.setAttribute('y', y + (this.dimensions.lozengeTextSize * 0.1));
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', this.dimensions.lozengeTextSize);
        numberElement.setAttribute('font-weight', 'bold');
        numberElement.setAttribute('fill', '#1e3a8a');
        numberElement.textContent = textContent;
        
        numberGroup.appendChild(rect);
        numberGroup.appendChild(numberElement);
        
        fallingNumber.element = numberGroup;
        fallingNumber.rect = rect;
        fallingNumber.text = numberElement;
        fallingNumber.rectWidth = rectWidth;
        fallingNumber.rectHeight = rectHeight;
        
        this.fallingNumbers.push(fallingNumber);
        this.svg.appendChild(numberGroup);
        
        return fallingNumber;
    }
    
    updateFallingNumberDisplay(fallingNumber) {
        if (!fallingNumber.element) return;
        
        // Recalculate responsive dimensions for existing falling number
        const textContent = BALLOON_CONFIG.NUMBER_TO_WORD[fallingNumber.number] || fallingNumber.number.toString();
        const charWidth = this.dimensions.lozengeTextSize * 0.75;
        const padding = this.dimensions.lozengeTextSize * 1.25;
        const rectWidth = Math.max(this.dimensions.balloonRadius * 2, textContent.length * charWidth + padding);
        const rectHeight = this.dimensions.lozengeTextSize * 1.875;
        
        if (fallingNumber.rect) {
            fallingNumber.rect.setAttribute('x', fallingNumber.x - rectWidth/2);
            fallingNumber.rect.setAttribute('y', fallingNumber.y - rectHeight/2);
            fallingNumber.rect.setAttribute('width', rectWidth);
            fallingNumber.rect.setAttribute('height', rectHeight);
            fallingNumber.rect.setAttribute('rx', rectHeight * 0.5);
            fallingNumber.rect.setAttribute('ry', rectHeight * 0.5);
        }
        
        if (fallingNumber.text) {
            fallingNumber.text.setAttribute('x', fallingNumber.x);
            fallingNumber.text.setAttribute('y', fallingNumber.y + (this.dimensions.lozengeTextSize * 0.1));
            fallingNumber.text.setAttribute('font-size', this.dimensions.lozengeTextSize);
        }
        
        fallingNumber.rectWidth = rectWidth;
        fallingNumber.rectHeight = rectHeight;
    }
    
    startAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.animationLoop(time));
    }
    
    animationLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update falling numbers - only vertical movement
        this.fallingNumbers.forEach((fallingNumber, index) => {
            if (!fallingNumber.landed) {
                // Only update Y position - no swinging
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    fallingNumber.landedTime = currentTime;
                }
                
                // Update rectangle position - only Y coordinate
                if (fallingNumber.rect) {
                    fallingNumber.rect.setAttribute('y', fallingNumber.y - fallingNumber.rectHeight/2);
                }
                if (fallingNumber.text) {
                    fallingNumber.text.setAttribute('y', fallingNumber.y + (this.dimensions.lozengeTextSize * 0.1));
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
        
        // Continue animation if there are active elements
        if (this.balloons.length > 0 || this.fallingNumbers.length > 0) {
            this.animationId = requestAnimationFrame((time) => this.animationLoop(time));
        }
    }
    
    fadeOutIncorrectBalloons() {
        console.log('🎈 Fading out incorrect balloons');
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped && !balloon.isCorrect) {
                balloon.group.style.transition = 'opacity 1s ease-out';
                balloon.group.style.opacity = '0';
                
                // Remove after fade without popping sound
                setTimeout(() => {
                    if (balloon.group && balloon.group.parentNode) {
                        balloon.group.parentNode.removeChild(balloon.group);
                    }
                    // Remove from balloons array
                    const index = this.balloons.indexOf(balloon);
                    if (index > -1) {
                        this.balloons.splice(index, 1);
                    }
                }, 1000);
            }
        });
    }
    
    areAllFallingNumbersGone() {
        return this.fallingNumbers.length === 0;
    }
    
    clearBalloons() {
        // Remove all balloon DOM elements
        this.balloons.forEach(balloon => {
            if (balloon.group && balloon.group.parentNode) {
                balloon.group.parentNode.removeChild(balloon.group);
            }
        });
        this.balloons = [];
    }
    
    clearFallingNumbers() {
        // Remove all falling number DOM elements
        this.fallingNumbers.forEach(fn => {
            if (fn.element && fn.element.parentNode) {
                fn.element.parentNode.removeChild(fn.element);
            }
        });
        this.fallingNumbers = [];
    }
    
    clearAll() {
        console.log('🧹 Clearing all renderer elements');
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear all elements
        this.clearBalloons();
        this.clearFallingNumbers();
        
        // Reset traffic light
        this.resetTrafficLight();
        
        // Clear SVG
        if (this.svg) {
            this.svg.innerHTML = '';
        }
    }
    
    reset() {
        console.log('🔄 Resetting renderer');
        this.clearAll();
    }
    
    destroy() {
        console.log('🧹 Destroying Balloon Renderer');
        
        this.clearAll();
        
        // Remove traffic light
        if (this.trafficLightContainer && this.trafficLightContainer.parentNode) {
            this.trafficLightContainer.parentNode.removeChild(this.trafficLightContainer);
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('✅ Balloon Renderer destroyed');
    }
}
