class SliderRenderer {
    constructor() {
        this.sliderContainer = document.getElementById('sliderContainer');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.getElementById('bottomBar');
        this.beads = [];
        this.containerRect = null;
        this.frameImageRect = null;
        
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
        
        // Calculate the actual frame image dimensions within the container
        // The frame image uses "contain" so we need to find its actual rendered size
        const containerAspectRatio = this.containerRect.width / this.containerRect.height;
        const imageAspectRatio = 1516 / 475; // Exact aspect ratio of slider frame (1516x475)
        
        if (containerAspectRatio > imageAspectRatio) {
            // Container is wider than image - image is constrained by height
            this.frameImageRect = {
                width: this.containerRect.height * imageAspectRatio,
                height: this.containerRect.height,
                x: (this.containerRect.width - this.containerRect.height * imageAspectRatio) / 2,
                y: 0
            };
        } else {
            // Container is taller than image - image is constrained by width
            this.frameImageRect = {
                width: this.containerRect.width,
                height: this.containerRect.width / imageAspectRatio,
                x: 0,
                y: (this.containerRect.height - this.containerRect.width / imageAspectRatio) / 2
            };
        }
        
        // Calculate bead diameter as 12% of frame image height
        this.beadDiameter = this.frameImageRect.height * 0.12;
        this.beadRadius = this.beadDiameter / 2;
        
        // Update bar dimensions
        this.updateBarDimensions();
    }
    
    updateBarDimensions() {
        if (!this.frameImageRect) return;
        
        const barHeight = this.frameImageRect.height * 0.05; // 5% of frame height
        const barWidth = this.frameImageRect.width * 0.86; // 86% of frame width
        const barLeft = this.frameImageRect.x + (this.frameImageRect.width * 0.06); // 6% from left of frame
        
        // Top bar at 34% of frame height
        const topBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.34);
        this.topBar.style.position = 'absolute';
        this.topBar.style.left = `${barLeft}px`;
        this.topBar.style.top = `${topBarTop}px`;
        this.topBar.style.width = `${barWidth}px`;
        this.topBar.style.height = `${barHeight}px`;
        
        // Bottom bar at 60% of frame height
        const bottomBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.60);
        this.bottomBar.style.position = 'absolute';
        this.bottomBar.style.left = `${barLeft}px`;
        this.bottomBar.style.top = `${bottomBarTop}px`;
        this.bottomBar.style.width = `${barWidth}px`;
        this.bottomBar.style.height = `${barHeight}px`;
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
        
        // Set circular size - diameter is 12% of frame image height
        beadElement.style.width = `${this.beadDiameter}px`;
        beadElement.style.height = `${this.beadDiameter}px`;
        beadElement.style.position = 'absolute';
        
        // Color: first 5 blue, last 5 red on each bar
        const isBlue = beadIndex < 5;
        beadElement.classList.add(isBlue ? 'blue' : 'red');
        
        // Initial position: All beads start stacked on the LEFT side at position 0
        // This ensures they can all move right and aren't blocked by collision detection
        const startPosition = 0;
        
        const bead = {
            element: beadElement,
            barIndex: barIndex, // 0 = top, 1 = bottom
            position: startPosition, // All beads start at position 0
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
        if (!this.frameImageRect) return;
        
        const barY = bead.barIndex === 0 ? 0.34 : 0.60; // 34% or 60% of frame height
        
        // Calculate bead center position based on frame image dimensions
        // First bead center is at 6% margin + 6% radius = 12% from left edge of frame
        const beadCenterX = this.frameImageRect.x + 
                           (this.frameImageRect.width * 0.06) + // Left margin
                           this.beadRadius + // Half bead width to center
                           (bead.position * this.beadDiameter); // Spacing between beads
        
        const beadCenterY = this.frameImageRect.y + (this.frameImageRect.height * barY);
        
        // Position bead so its center is at the calculated position
        const beadLeft = beadCenterX - this.beadRadius;
        const beadTop = beadCenterY - this.beadRadius;
        
        bead.element.style.left = `${beadLeft}px`;
        bead.element.style.top = `${beadTop}px`;
    }
    
    repositionAllBeads() {
        this.updateContainerRect(); // Recalculate dimensions
        this.beads.forEach(bead => {
            if (!bead.isDragging) {
                // Update bead size for new container dimensions
                bead.element.style.width = `${this.beadDiameter}px`;
                bead.element.style.height = `${this.beadDiameter}px`;
                this.positionBead(bead);
            }
        });
    }
    
    getBeadAtPosition(x, y) {
        // Convert screen coordinates to check against bead positions
        for (let bead of this.beads) {
            const beadRect = bead.element.getBoundingClientRect();
            
            if (x >= beadRect.left && 
                x <= beadRect.right &&
                y >= beadRect.top && 
                y <= beadRect.bottom) {
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
            bead.element.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
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
            // Moving right - include startBead and all beads to the right of it
            return allConnected.slice(startIndex);
        } else {
            // Moving left - include startBead and all beads to the left of it
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
            const newPos = targetPosition + i; // Consecutive positions
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
        let testPosition = Math.round(targetPosition);
        
        // First try the exact position
        if (this.canBlockMoveToPosition(block, testPosition, direction)) {
            return testPosition;
        }
        
        // Try positions in both directions to find the closest valid spot
        for (let offset = 1; offset <= CONFIG.BEADS_PER_BAR; offset++) {
            // Try position closer to the direction of movement first
            let primaryTest = testPosition + (offset * Math.sign(direction));
            let secondaryTest = testPosition - (offset * Math.sign(direction));
            
            if (this.canBlockMoveToPosition(block, primaryTest, direction)) {
                return primaryTest;
            }
            
            if (this.canBlockMoveToPosition(block, secondaryTest, direction)) {
                return secondaryTest;
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
                    const snapPos = otherBead.position - block.length;
                    if (this.canBlockMoveToPosition(block, snapPos, direction)) {
                        return snapPos;
                    }
                }
            } else {
                // Moving left - check if we should snap to bead on the left
                const distance = blockStart - otherBead.position;
                if (distance > 0 && distance <= magneticRange) {
                    const snapPos = otherBead.position + 1;
                    if (this.canBlockMoveToPosition(block, snapPos, direction)) {
                        return snapPos;
                    }
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
