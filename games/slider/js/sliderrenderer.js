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
        
        // Initial position: All beads start on the left, aligned with no gaps
        // Positions 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 (consecutive, no overlapping)
        const startPosition = beadIndex;
        
        const bead = {
            element: beadElement,
            barIndex: barIndex, // 0 = top, 1 = bottom
            position: startPosition, // Consecutive positions 0-9
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
        // According to specs: if connected beads exist on the drag side, move the whole block
        
        const connectedBeads = this.getConnectedBeads(startBead);
        const startIndex = connectedBeads.indexOf(startBead);
        
        if (direction > 0) {
            // Moving right - include startBead and all connected beads to the right
            return connectedBeads.slice(startIndex);
        } else {
            // Moving left - include startBead and all connected beads to the left
            return connectedBeads.slice(0, startIndex + 1);
        }
    }
    
    canBlockMoveToPosition(block, targetPosition, direction) {
        // Simplified logic: beads can always move if there's physical space
        // They can push other beads forward
        if (block.length === 0) return false;
        
        // Check bounds only
        const leftmostPosition = targetPosition;
        const rightmostPosition = targetPosition + block.length - 1;
        
        // Make sure we don't go out of bounds
        if (leftmostPosition < 0 || rightmostPosition >= CONFIG.BEADS_PER_BAR) {
            return false;
        }
        
        return true; // Always allow movement within bounds
    }
    
    findNearestValidPosition(block, targetPosition, direction) {
        // Allow movement to the target position, just ensure it's within bounds
        let testPosition = targetPosition; // Don't round immediately
        
        // Ensure the block fits within bounds
        const maxPosition = CONFIG.BEADS_PER_BAR - block.length;
        testPosition = Math.max(0, Math.min(maxPosition, testPosition));
        
        return testPosition; // Return the actual position, not rounded
    }
    
    moveBlockToPosition(block, targetPosition) {
        console.log('moveBlockToPosition called with:', block.length, 'beads, target:', targetPosition);
        
        // Move all beads in the block to consecutive positions starting from targetPosition
        // Also handle pushing other beads out of the way
        
        const barIndex = block[0].barIndex;
        const barBeads = this.getBeadsOnBar(barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        console.log('Other beads on bar:', otherBeads.length);
        
        // Calculate the positions this block will occupy
        const blockPositions = [];
        for (let i = 0; i < block.length; i++) {
            blockPositions.push(targetPosition + i);
        }
        
        console.log('Block will occupy positions:', blockPositions);
        
        // Find any beads that would be displaced and push them
        for (let otherBead of otherBeads) {
            const otherPosition = Math.round(otherBead.position);
            
            // Check if this bead is in the way
            if (blockPositions.includes(otherPosition)) {
                console.log('Pushing bead', otherBead.id, 'from position', otherPosition);
                
                // Push the bead out of the way
                // Find the nearest free position
                let newPosition = otherPosition;
                
                // Try to push right first
                while (newPosition < CONFIG.BEADS_PER_BAR) {
                    if (!blockPositions.includes(newPosition) && 
                        !otherBeads.some(b => b !== otherBead && Math.round(b.position) === newPosition)) {
                        break;
                    }
                    newPosition++;
                }
                
                // If couldn't push right, try left
                if (newPosition >= CONFIG.BEADS_PER_BAR) {
                    newPosition = otherPosition;
                    while (newPosition >= 0) {
                        if (!blockPositions.includes(newPosition) && 
                            !otherBeads.some(b => b !== otherBead && Math.round(b.position) === newPosition)) {
                            break;
                        }
                        newPosition--;
                    }
                }
                
                // Move the displaced bead
                if (newPosition >= 0 && newPosition < CONFIG.BEADS_PER_BAR) {
                    console.log('Moved displaced bead to position:', newPosition);
                    otherBead.position = newPosition;
                    this.positionBead(otherBead);
                }
            }
        }
        
        // Now move the block to its target position
        console.log('Moving block to target positions starting at:', targetPosition);
        block.forEach((bead, index) => {
            const newPosition = targetPosition + index;
            const clampedPosition = Math.max(0, Math.min(CONFIG.BEADS_PER_BAR - 1, newPosition));
            console.log(`Moving bead ${bead.id} from ${bead.position} to ${clampedPosition}`);
            bead.position = clampedPosition;
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
