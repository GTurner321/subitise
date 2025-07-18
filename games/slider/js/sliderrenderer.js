class SliderRenderer {
    constructor() {
        this.sliderContainer = document.getElementById('sliderContainer');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.getElementById('bottomBar');
        this.beads = [];
        this.containerRect = null;
        
        this.updateContainerRect();
        this.initializeBeads();
        
        // Update container rect on window resize
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.repositionAllBeads();
        });
    }
    
    updateContainerRect() {
        this.containerRect = this.sliderContainer.getBoundingClientRect();
    }
    
    initializeBeads() {
        // Clear existing beads
        this.beads.forEach(bead => {
            if (bead.element && bead.element.parentNode) {
                bead.element.parentNode.removeChild(bead.element);
            }
        });
        this.beads = [];
        
        // Create 20 beads (10 per bar)
        for (let bar = 0; bar < 2; bar++) {
            for (let i = 0; i < CONFIG.BEADS_PER_BAR; i++) {
                const bead = this.createBead(bar, i);
                this.beads.push(bead);
            }
        }
    }
    
    createBead(barIndex, beadIndex) {
        const beadElement = document.createElement('div');
        beadElement.className = 'bead';
        
        // Color: first 5 blue, last 5 red on each bar
        const isBlue = beadIndex < 5;
        beadElement.classList.add(isBlue ? 'blue' : 'red');
        
        // Initial position on left side of bar
        const bead = {
            element: beadElement,
            barIndex: barIndex, // 0 = top, 1 = bottom
            position: beadIndex, // Position along the bar (0-based from left)
            id: `bead-${barIndex}-${beadIndex}`,
            isDragging: false,
            isBlue: isBlue
        };
        
        // Set initial position
        this.positionBead(bead);
        
        this.sliderContainer.appendChild(beadElement);
        return bead;
    }
    
    positionBead(bead) {
        const barY = bead.barIndex === 0 ? CONFIG.TOP_BAR_POSITION : CONFIG.BOTTOM_BAR_POSITION;
        const beadSize = 12; // Percentage of container (circular)
        
        // Calculate X position - beads are positioned from left with no gaps
        const barStartX = CONFIG.BAR_LEFT_MARGIN;
        const beadWidth = beadSize; // Circular bead
        
        // Position beads consecutively from left with no gaps
        const xPercent = barStartX + (bead.position * beadWidth);
        
        bead.element.style.left = `${xPercent}%`;
        bead.element.style.top = `${barY - (beadSize / 2)}%`;
    }
    
    repositionAllBeads() {
        this.beads.forEach(bead => {
            if (!bead.isDragging) {
                this.positionBead(bead);
            }
        });
    }
    
    getBeadAtPosition(x, y) {
        // Convert screen coordinates to container coordinates
        const containerRect = this.sliderContainer.getBoundingClientRect();
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let bead of this.beads) {
            const beadRect = bead.element.getBoundingClientRect();
            const beadRelativeX = beadRect.left - containerRect.left;
            const beadRelativeY = beadRect.top - containerRect.top;
            const beadWidth = beadRect.width;
            const beadHeight = beadRect.height;
            
            if (relativeX >= beadRelativeX && 
                relativeX <= beadRelativeX + beadWidth &&
                relativeY >= beadRelativeY && 
                relativeY <= beadRelativeY + beadHeight) {
                return bead;
            }
        }
        return null;
    }
    
    getBeadsOnBar(barIndex) {
        return this.beads.filter(bead => bead.barIndex === barIndex);
    }
    
    getBeadsAtPosition(barIndex, position) {
        return this.beads.filter(bead => 
            bead.barIndex === barIndex && 
            Math.abs(bead.position - position) < 0.1
        );
    }
    
    moveBeadToPosition(bead, newPosition, animate = true) {
        // Clamp position to valid range
        newPosition = Math.max(0, Math.min(CONFIG.BEADS_PER_BAR - 1, newPosition));
        
        bead.position = newPosition;
        
        if (animate) {
            bead.element.style.transition = 'left 0.2s ease-out';
            setTimeout(() => {
                bead.element.style.transition = 'none';
            }, 200);
        }
        
        this.positionBead(bead);
    }
    
    getConnectedBeads(startBead) {
        const connectedBeads = [startBead];
        const barBeads = this.getBeadsOnBar(startBead.barIndex)
            .sort((a, b) => a.position - b.position);
        
        const startIndex = barBeads.indexOf(startBead);
        
        // Check left connected beads (consecutive positions)
        for (let i = startIndex - 1; i >= 0; i--) {
            if (Math.abs(barBeads[i].position - barBeads[i + 1].position) < 1.1) {
                connectedBeads.unshift(barBeads[i]);
            } else {
                break;
            }
        }
        
        // Check right connected beads (consecutive positions)
        for (let i = startIndex + 1; i < barBeads.length; i++) {
            if (Math.abs(barBeads[i].position - barBeads[i - 1].position) < 1.1) {
                connectedBeads.push(barBeads[i]);
            } else {
                break;
            }
        }
        
        return connectedBeads;
    }
    
    getBeadBlockInDirection(startBead, direction) {
        // Get the block of beads that should move together in the given direction
        // direction: 1 for right, -1 for left
        const allConnected = this.getConnectedBeads(startBead);
        const startIndex = allConnected.indexOf(startBead);
        
        if (direction > 0) {
            // Moving right - include startBead and all beads to the right
            return allConnected.slice(startIndex);
        } else {
            // Moving left - include startBead and all beads to the left
            return allConnected.slice(0, startIndex + 1);
        }
    }
    
    canBlockMoveToPosition(block, targetPosition, direction) {
        // Check if the entire block can move to the target position
        if (block.length === 0) return false;
        
        const barBeads = this.getBeadsOnBar(block[0].barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        // Calculate the positions the block would occupy
        const blockPositions = [];
        for (let i = 0; i < block.length; i++) {
            const newPos = targetPosition + (i * (direction > 0 ? 1 : -1));
            if (newPos < 0 || newPos >= CONFIG.BEADS_PER_BAR) {
                return false; // Out of bounds
            }
            blockPositions.push(newPos);
        }
        
        // Check for collisions with other beads
        for (let otherBead of otherBeads) {
            for (let blockPos of blockPositions) {
                if (Math.abs(otherBead.position - blockPos) < 0.9) {
                    return false; // Collision detected
                }
            }
        }
        
        return true;
    }
    
    findNearestValidPosition(block, targetPosition, direction) {
        // Find the nearest valid position where the block can be placed
        let testPosition = targetPosition;
        const step = direction > 0 ? -0.1 : 0.1; // Move away from collision
        
        for (let attempts = 0; attempts < 100; attempts++) {
            if (this.canBlockMoveToPosition(block, testPosition, direction)) {
                return testPosition;
            }
            testPosition += step;
            
            // Check bounds
            if (direction > 0) {
                if (testPosition + block.length - 1 >= CONFIG.BEADS_PER_BAR) break;
            } else {
                if (testPosition < 0) break;
            }
        }
        
        return null; // No valid position found
    }
    
    moveBlockToPosition(block, targetPosition) {
        // Move all beads in the block to consecutive positions starting from targetPosition
        block.forEach((bead, index) => {
            const newPosition = targetPosition + index;
            bead.position = Math.max(0, Math.min(CONFIG.BEADS_PER_BAR - 1, newPosition));
            this.positionBead(bead);
        });
    }
    
    checkMagneticSnapping(block, direction) {
        // Check if the block should snap to nearby beads
        if (block.length === 0) return null;
        
        const barBeads = this.getBeadsOnBar(block[0].barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        const blockStart = Math.min(...block.map(b => b.position));
        const blockEnd = Math.max(...block.map(b => b.position));
        
        const magneticRange = 1.5; // Distance for magnetic snapping
        
        for (let otherBead of otherBeads) {
            if (direction > 0) {
                // Moving right - check if we should snap to bead on the right
                const distance = otherBead.position - blockEnd;
                if (distance > 0 && distance <= magneticRange) {
                    return otherBead.position - block.length; // Snap position
                }
            } else {
                // Moving left - check if we should snap to bead on the left
                const distance = blockStart - otherBead.position;
                if (distance > 0 && distance <= magneticRange) {
                    return otherBead.position + 1; // Snap position
                }
            }
        }
        
        return null; // No magnetic snap
    }
    
    countBeadsOnRightSide() {
        let rightSideCount = 0;
        const threshold = CONFIG.BEADS_PER_BAR / 2; // Middle point
        
        this.beads.forEach(bead => {
            if (bead.position >= threshold) {
                rightSideCount++;
            }
        });
        
        return rightSideCount;
    }
    
    hasBeadsInMiddle() {
        // Check if there are any beads isolated in the middle
        const leftThreshold = 2; // First 2 positions are "left"
        const rightThreshold = CONFIG.BEADS_PER_BAR - 3; // Last 2 positions are "right"
        
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.getBeadsOnBar(barIndex);
            
            for (let bead of barBeads) {
                if (bead.position > leftThreshold && bead.position < rightThreshold) {
                    // Check if this bead is connected to others on left or right
                    const connectedBeads = this.getConnectedBeads(bead);
                    const minPos = Math.min(...connectedBeads.map(b => b.position));
                    const maxPos = Math.max(...connectedBeads.map(b => b.position));
                    
                    // If the connected group doesn't extend to left or right edge, it's in middle
                    if (minPos > leftThreshold && maxPos < rightThreshold) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    reset() {
        this.initializeBeads();
    }
    
    playSnapSound() {
        // Simple click sound using Web Audio API
        if (CONFIG.AUDIO_ENABLED) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                // Silent failure
            }
        }
    }
}
