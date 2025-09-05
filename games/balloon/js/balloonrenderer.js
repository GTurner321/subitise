class BalloonRenderer {
    constructor(svg, config, fallingNumbers) {
        this.svg = svg;
        this.config = config;
        this.fallingNumbers = fallingNumbers; // Share reference with physics
        
        // UI elements
        this.trafficLightContainer = null;
        this.trafficLights = [];
        
        this.createTrafficLight();
    }

    /**
     * Create balloon visual elements and add to SVG
     */
    createBalloonVisuals(balloon) {
        const balloonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        balloonGroup.setAttribute('class', 'balloon-group');
        balloonGroup.style.cursor = 'pointer';
        balloonGroup.style.opacity = '0';
        
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
        
        // Number text
        const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberText.setAttribute('x', balloon.x + balloon.radius);
        numberText.setAttribute('y', balloon.y + balloon.radius + 2);
        numberText.setAttribute('text-anchor', 'middle');
        numberText.setAttribute('dominant-baseline', 'middle');
        numberText.setAttribute('font-size', '36');
        numberText.setAttribute('font-weight', 'bold');
        numberText.setAttribute('fill', '#000000');
        numberText.textContent = balloon.number.toString();
        
        balloonGroup.appendChild(balloonCircle);
        balloonGroup.appendChild(highlight);
        balloonGroup.appendChild(numberText);
        
        // Store references in balloon object
        balloon.group = balloonGroup;
        balloon.string = string;
        balloon.circle = balloonCircle;
        balloon.highlight = highlight;
        balloon.text = numberText;
        
        this.svg.appendChild(balloonGroup);
        return balloonGroup;
    }

    /**
     * Create curved balloon string
     */
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

    /**
     * Update balloon visual position based on physics
     */
    updateBalloonPosition(balloon) {
        if (!balloon.group || balloon.popped) return;
        
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

    /**
     * Create pop effect animation
     */
    createPopEffect(x, y) {
        const popEffect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        popEffect.setAttribute('cx', x);
        popEffect.setAttribute('cy', y);
        popEffect.setAttribute('r', 5);
        popEffect.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
        popEffect.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
        popEffect.setAttribute('stroke-width', 2);
        
        this.svg.appendChild(popEffect);
        
        // Animate the pop effect
        let startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / 300, 1); // 300ms animation
            
            const radius = 5 + (progress * 25); // Expand from 5 to 30
            const opacity = 1 - progress; // Fade out
            
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

    /**
     * Create falling number animation
     */
    createFallingNumber(x, y, number) {
        const grassBandHeight = 80;
        const gameAreaHeight = this.config.SVG_HEIGHT;
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
            speed: this.config.FALLING_NUMBER_SPEED,
            element: null,
            landed: false,
            landedTime: 0
        };
        
        // Get text to measure width
        const textContent = this.config.NUMBER_TO_WORD[number] || number.toString();
        
        // Calculate rectangle width based on text length
        const charWidth = 12;
        const padding = 20;
        const rectWidth = Math.max(80, textContent.length * charWidth + padding);
        const rectHeight = 30;
        
        // Create group for rectangle background and text
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('class', 'falling-number-group');
        
        // Create rounded rectangle background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - rectWidth/2);
        rect.setAttribute('y', y - rectHeight/2);
        rect.setAttribute('width', rectWidth);
        rect.setAttribute('height', rectHeight);
        rect.setAttribute('rx', '15');
        rect.setAttribute('ry', '15');
        rect.setAttribute('fill', '#add8e6');
        rect.setAttribute('stroke', '#4682b4');
        rect.setAttribute('stroke-width', '2');
        
        // Create text element with word version of number
        const numberElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numberElement.setAttribute('x', x);
        numberElement.setAttribute('y', y + 2);
        numberElement.setAttribute('text-anchor', 'middle');
        numberElement.setAttribute('dominant-baseline', 'middle');
        numberElement.setAttribute('font-size', '20');
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

    /**
     * Update falling number position based on physics
     */
    updateFallingNumberPosition(fallingNumber) {
        if (fallingNumber.landed) return;
        
        // Update rectangle position - only Y coordinate
        if (fallingNumber.rect) {
            fallingNumber.rect.setAttribute('y', fallingNumber.y - fallingNumber.rectHeight/2);
        }
        if (fallingNumber.text) {
            fallingNumber.text.setAttribute('y', fallingNumber.y + 2);
        }
    }

    /**
     * Remove landed falling number after delay
     */
    removeFallingNumber(fallingNumber) {
        if (fallingNumber.element && fallingNumber.element.parentNode) {
            fallingNumber.element.parentNode.removeChild(fallingNumber.element);
        }
        
        const index = this.fallingNumbers.indexOf(fallingNumber);
        if (index > -1) {
            this.fallingNumbers.splice(index, 1);
        }
    }

    /**
     * Show target number display
     */
    showTargetNumber(targetNumber) {
        // Create target number display
        const targetDisplay = document.createElement('div');
        targetDisplay.id = 'targetNumberDisplay';
        targetDisplay.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 100; text-align: center; opacity: 0; transition: opacity 1s ease-in-out;
        `;
        
        // Large number
        const numberElement = document.createElement('div');
        numberElement.textContent = targetNumber.toString();
        numberElement.style.cssText = `
            font-size: 8rem; font-weight: bold; color: #dc3545;
            font-family: Arial, sans-serif; line-height: 1; margin-bottom: 10px;
        `;
        
        // Text version
        const textElement = document.createElement('div');
        textElement.textContent = this.config.NUMBER_TO_WORD[targetNumber] || targetNumber.toString();
        textElement.style.cssText = `
            font-size: 2rem; font-weight: bold; color: #dc3545; font-family: Arial, sans-serif;
        `;
        
        targetDisplay.appendChild(numberElement);
        targetDisplay.appendChild(textElement);
        document.body.appendChild(targetDisplay);
        
        // Fade in
        setTimeout(() => {
            targetDisplay.style.opacity = '1';
        }, 100);
        
        // Return element so controller can manage removal
        return targetDisplay;
    }

    /**
     * Remove target number display
     */
    removeTargetNumber(targetDisplay) {
        if (targetDisplay) {
            targetDisplay.style.opacity = '0';
            setTimeout(() => {
                if (targetDisplay.parentNode) {
                    targetDisplay.parentNode.removeChild(targetDisplay);
                }
            }, 1000);
        }
    }

    /**
     * Create traffic light UI
     */
    createTrafficLight() {
        this.trafficLightContainer = document.createElement('div');
        this.trafficLightContainer.style.cssText = `
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%); z-index: 1000;
            background: rgba(0, 0, 0, 0.8); border-radius: 20px; padding: 15px 10px;
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // Create traffic lights (need 8 for correct balloons)
        for (let i = 0; i < this.config.CORRECT_BALLOONS; i++) {
            const light = document.createElement('div');
            light.style.cssText = `
                width: 20px; height: 20px; border-radius: 50%; background: #333;
                border: 2px solid #555; transition: all 0.3s ease;
            `;
            
            this.trafficLights.push(light);
            this.trafficLightContainer.appendChild(light);
        }
        
        document.body.appendChild(this.trafficLightContainer);
    }

    /**
     * Update traffic light based on balloon pop order
     */
    updateTrafficLight(balloonPopOrder) {
        this.trafficLights.forEach((light, index) => {
            if (index < balloonPopOrder.length) {
                const wasUserPopped = balloonPopOrder[index];
                if (wasUserPopped) {
                    // Green for user-popped balloons
                    light.style.backgroundColor = '#4CAF50';
                    light.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.8)';
                } else {
                    // Grey for ceiling-hit balloons
                    light.style.backgroundColor = '#808080';
                    light.style.boxShadow = '0 0 10px rgba(128, 128, 128, 0.8)';
                }
            } else {
                // Dark for not processed
                light.style.backgroundColor = '#333';
                light.style.boxShadow = 'none';
            }
        });
    }

    /**
     * Reset traffic light to initial state
     */
    resetTrafficLight() {
        this.trafficLights.forEach(light => {
            light.style.backgroundColor = '#333';
            light.style.boxShadow = 'none';
        });
    }

    /**
     * Fade out remaining incorrect balloons
     */
    fadeOutIncorrectBalloons(balloons) {
        balloons.forEach(balloon => {
            if (!balloon.popped && !balloon.isCorrect && balloon.group) {
                balloon.group.style.transition = 'opacity 1s ease-out';
                balloon.group.style.opacity = '0';
                
                // Remove after fade without popping sound
                setTimeout(() => {
                    if (balloon.group && balloon.group.parentNode) {
                        balloon.group.parentNode.removeChild(balloon.group);
                    }
                }, 1000);
            }
        });
    }

    /**
     * Fade in all balloons over 2 seconds
     */
    fadeInAllBalloons(balloons) {
        setTimeout(() => {
            balloons.forEach(balloon => {
                if (balloon.group) {
                    balloon.group.style.transition = 'opacity 2s ease-in';
                    balloon.group.style.opacity = '1';
                }
            });
        }, 100);
    }

    /**
     * Remove balloon visual elements
     */
    removeBalloon(balloon) {
        if (balloon.group) {
            balloon.group.remove();
        }
    }

    /**
     * Clear all visual elements
     */
    clearAll() {
        // Clear SVG completely
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        // Clear falling numbers array (elements already removed by SVG clear)
        this.fallingNumbers = [];
    }

    /**
     * Destroy renderer and clean up
     */
    destroy() {
        this.clearAll();
        
        if (this.trafficLightContainer && this.trafficLightContainer.parentNode) {
            this.trafficLightContainer.parentNode.removeChild(this.trafficLightContainer);
        }
        
        this.trafficLights = [];
        this.fallingNumbers = [];
    }
}
