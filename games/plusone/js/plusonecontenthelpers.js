console.log('🛠️ LOADING PLUS ONE CONTENT HELPERS - Utilities and Positioning');

class PlusOneContentHelpers {
    constructor(renderer) {
        this.renderer = renderer;
        this.previousIcon = null;
        this.previousColor = null;
        
        console.log('🛠️ Content helpers initialized');
    }

    // ===== ICON AND COLOR SELECTION =====
    
    getRandomIcon() {
        const icons = CONFIG.ICONS;
        let selectedIcon;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            selectedIcon = icons[Math.floor(Math.random() * icons.length)];
            attempts++;
        } while (selectedIcon === this.previousIcon && attempts < maxAttempts);
        
        this.previousIcon = selectedIcon;
        return selectedIcon;
    }

    getRandomColor() {
        const colors = CONFIG.COLORS;
        let selectedColor;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            selectedColor = colors[Math.floor(Math.random() * colors.length)];
            attempts++;
        } while (selectedColor === this.previousColor && attempts < maxAttempts);
        
        this.previousColor = selectedColor;
        return selectedColor;
    }

    // ===== POSITION GENERATION SYSTEM =====
    
    generatePositions(count, side, contentType) {
        console.log(`🎲 Generating positions for ${count} ${contentType}s on ${side} side`);
        
        if (count === 0) return [];
        
        const positions = [];
        const maxAttempts = 120;
        let totalFallbacks = 0;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            // Try positioning with smart placement and progressive spacing relaxation
            while (!validPosition && attempts < maxAttempts) {
                const smartPos = this.generateSmartPosition(positions, side);
                x = smartPos.x;
                y = smartPos.y;
                
                // Check distance with progressive relaxation using Manhattan distance
                validPosition = this.checkManhattanDistance(x, y, positions, attempts, contentType);
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`⚠️ Could not find valid position for ${side} ${contentType} ${i} after ${maxAttempts} attempts - using emergency smart placement`);
                const emergencyPos = this.generateSmartPosition(positions, side);
                x = emergencyPos.x;
                y = emergencyPos.y;
                totalFallbacks++;
            } else {
                console.log(`✅ Found position for ${side} ${contentType} ${i} at (${x.toFixed(1)}%, ${y.toFixed(1)}%) after ${attempts} attempts`);
            }
            
            positions.push({ x, y });
        }
        
        console.log(`📊 ${side} side: ${count - totalFallbacks} valid positions, ${totalFallbacks} emergency placements`);
        return positions;
    }

    generateSmartPosition(existingPositions, side) {
        // Define midpoints for each side in game area coordinates
        let xMidpoint, yMidpoint;
        
        if (side === 'left') {
            xMidpoint = 23; // 23% - midpoint of left area (6%-40%)
            yMidpoint = 60; // 60% - midpoint of vertical area (30%-90%)
        } else { // right side
            xMidpoint = 77; // 77% - midpoint of right area (60%-94%)
            yMidpoint = 60; // 60% - same vertical midpoint as left
        }
        
        let avgX = xMidpoint;
        let avgY = yMidpoint;
        
        if (existingPositions.length > 0) {
            avgX = existingPositions.reduce((sum, pos) => sum + pos.x, 0) / existingPositions.length;
            avgY = existingPositions.reduce((sum, pos) => sum + pos.y, 0) / existingPositions.length;
        }
        
        // Smart positioning based on side-specific logic
        let xRange, yRange;
        
        if (side === 'left') {
            if (avgX >= 23) {
                xRange = { start: 6, end: 23 };
            } else {
                xRange = { start: 23, end: 40 };
            }
        } else {
            if (avgX >= 77) {
                xRange = { start: 60, end: 77 };
            } else {
                xRange = { start: 77, end: 94 };
            }
        }
        
        if (avgY >= 60) {
            yRange = { start: 30, end: 60 };
        } else {
            yRange = { start: 60, end: 90 };
        }
        
        const x = xRange.start + Math.random() * (xRange.end - xRange.start);
        const y = yRange.start + Math.random() * (yRange.end - yRange.start);
        
        console.log(`🧠 Smart positioning for ${side}: avgX=${avgX.toFixed(1)}%, avgY=${avgY.toFixed(1)}% → targeting (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
        
        return { x, y };
    }

    checkManhattanDistance(x, y, existingPositions, attempts = 0, contentType = 'icon') {
        // Calculate minimum distance based on attempt count and content type
        let baseDistance = contentType === 'icon' ? this.renderer.iconSizePercent : this.renderer.numberSizePercent;
        let minDistance;
        
        if (attempts <= 50) {
            minDistance = baseDistance * 1.5; // 1.5 content widths spacing
        } else if (attempts <= 100) {
            minDistance = baseDistance; // 1 content width spacing
        } else if (attempts <= 120) {
            minDistance = baseDistance * 0.5; // 0.5 content width spacing
        } else {
            return true; // Emergency placement
        }
        
        // Check against all existing positions using Manhattan distance
        for (let i = 0; i < existingPositions.length; i++) {
            const pos = existingPositions[i];
            const manhattanDistance = Math.abs(x - pos.x) + Math.abs(y - pos.y);
            
            if (manhattanDistance < minDistance) {
                return false;
            }
        }
        
        // Also check against all currently placed content using Manhattan distance
        for (let i = 0; i < this.renderer.currentContent.length; i++) {
            const content = this.renderer.currentContent[i];
            const contentX = parseFloat(content.style.left);
            const contentY = parseFloat(content.style.bottom);
            
            const manhattanDistance = Math.abs(x - contentX) + Math.abs(y - contentY);
            
            if (manhattanDistance < minDistance) {
                return false;
            }
        }
        
        return true;
    }

    // ===== CONTENT ANALYSIS AND UTILITIES =====
    
    analyzeContentDistribution(positions, side) {
        if (positions.length === 0) return null;
        
        const analysis = {
            count: positions.length,
            side: side,
            spread: {
                horizontal: { min: Math.min(...positions.map(p => p.x)), max: Math.max(...positions.map(p => p.x)) },
                vertical: { min: Math.min(...positions.map(p => p.y)), max: Math.max(...positions.map(p => p.y)) }
            },
            center: {
                x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
                y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
            },
            density: this.calculateDensity(positions),
            quality: this.assessPositionQuality(positions, side)
        };
        
        console.log(`📊 Content analysis for ${side} side:`, analysis);
        return analysis;
    }

    calculateDensity(positions) {
        if (positions.length <= 1) return 0;
        
        let totalDistance = 0;
        let pairCount = 0;
        
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(positions[i].x - positions[j].x, 2) + 
                    Math.pow(positions[i].y - positions[j].y, 2)
                );
                totalDistance += distance;
                pairCount++;
            }
        }
        
        return pairCount > 0 ? totalDistance / pairCount : 0;
    }

    assessPositionQuality(positions, side) {
        const boundaries = this.renderer.boundaries[side];
        let qualityScore = 100;
        
        // Check if all positions are within boundaries
        positions.forEach(pos => {
            if (pos.x < boundaries.horizontal.start || pos.x > boundaries.horizontal.end) {
                qualityScore -= 10;
            }
            if (pos.y < boundaries.vertical.start || pos.y > boundaries.vertical.end) {
                qualityScore -= 10;
            }
        });
        
        // Check for good distribution
        if (positions.length > 1) {
            const spread = {
                x: Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x)),
                y: Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y))
            };
            
            // Reward good spread
            const expectedSpread = {
                x: (boundaries.horizontal.end - boundaries.horizontal.start) * 0.5,
                y: (boundaries.vertical.end - boundaries.vertical.start) * 0.5
            };
            
            if (spread.x >= expectedSpread.x) qualityScore += 5;
            if (spread.y >= expectedSpread.y) qualityScore += 5;
        }
        
        return Math.max(0, Math.min(100, qualityScore));
    }

    // ===== CONTENT VALIDATION =====
    
    validateContentPlacement(contentType, gameMode, level) {
        const isValidForPictureFormat = CONFIG.usesPictureFormat(level, gameMode);
        const isValidContentType = (contentType === 'icon' && isValidForPictureFormat) || 
                                  (contentType === 'number' && !isValidForPictureFormat);
        
        if (!isValidContentType) {
            console.warn(`⚠️ Content type mismatch: ${contentType} not valid for level ${level} in ${gameMode} mode`);
            return false;
        }
        
        return true;
    }

    validatePositionBoundaries(positions, side) {
        const boundaries = this.renderer.boundaries[side];
        const violations = [];
        
        positions.forEach((pos, index) => {
            const issues = [];
            
            if (pos.x < boundaries.horizontal.start) issues.push('left boundary');
            if (pos.x > boundaries.horizontal.end) issues.push('right boundary');
            if (pos.y < boundaries.vertical.start) issues.push('bottom boundary');
            if (pos.y > boundaries.vertical.end) issues.push('top boundary');
            
            if (issues.length > 0) {
                violations.push({ index, position: pos, issues });
            }
        });
        
        if (violations.length > 0) {
            console.warn(`⚠️ Position boundary violations on ${side} side:`, violations);
        }
        
        return violations.length === 0;
    }

    // ===== CONTENT EFFECTS AND ANIMATIONS =====
    
    applyContentEffect(effectType, targetElements = null) {
        const elements = targetElements || this.renderer.currentContent;
        
        switch (effectType) {
            case 'highlight':
                this.highlightElements(elements);
                break;
            case 'jiggle':
                this.jiggleElements(elements);
                break;
            case 'pulse':
                this.pulseElements(elements);
                break;
            case 'glow':
                this.glowElements(elements);
                break;
            default:
                console.warn(`Unknown effect type: ${effectType}`);
        }
    }

    highlightElements(elements) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.filter = 'drop-shadow(0 0 15px #ffd700) brightness(1.2)';
                element.style.transform += ' scale(1.1)';
                
                setTimeout(() => {
                    element.style.filter = '';
                    element.style.transform = element.style.transform.replace(' scale(1.1)', '');
                }, 1500);
            }, index * 150);
        });
    }

    jiggleElements(elements) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'contentJiggle 0.6s ease-in-out';
                
                setTimeout(() => {
                    element.style.animation = '';
                }, 600);
            }, index * 100);
        });
    }

    pulseElements(elements) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'contentPulse 1s ease-in-out infinite';
                
                setTimeout(() => {
                    element.style.animation = '';
                }, 3000);
            }, index * 200);
        });
    }

    glowElements(elements) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.filter = 'drop-shadow(0 0 20px #4caf50)';
                
                setTimeout(() => {
                    element.style.filter = '';
                }, 2000);
            }, index * 100);
        });
    }

    // ===== DEBUGGING AND DIAGNOSTICS =====
    
    debugPositionGeneration(count, side, contentType) {
        console.group(`🔍 Debug: Generating ${count} ${contentType}s for ${side} side`);
        
        const startTime = performance.now();
        const positions = this.generatePositions(count, side, contentType);
        const endTime = performance.now();
        
        console.log(`⏱️ Generation time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`📍 Generated positions:`, positions);
        
        const analysis = this.analyzeContentDistribution(positions, side);
        const validation = this.validatePositionBoundaries(positions, side);
        
        console.log(`✅ Boundary validation: ${validation ? 'PASSED' : 'FAILED'}`);
        console.log(`📊 Quality score: ${analysis ? analysis.quality : 'N/A'}%`);
        
        console.groupEnd();
        
        return positions;
    }

    generateDiagnosticReport() {
        const report = {
            timestamp: new Date().toISOString(),
            renderer: {
                ready: this.renderer.buttonBarReady,
                dimensions: this.renderer.gameAreaDimensions,
                contentCount: this.renderer.currentContent.length
            },
            positions: {
                stored: this.renderer.storedPositions,
                current: this.renderer.currentContentCount
            },
            boundaries: this.renderer.boundaries,
            helpers: {
                previousIcon: this.previousIcon,
                previousColor: this.previousColor
            }
        };
        
        console.log('📋 Diagnostic Report:', report);
        return report;
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    
    optimizePositionGeneration(count, side) {
        // For large numbers of elements, use optimized algorithms
        if (count > 6) {
            return this.generateOptimizedPositions(count, side);
        }
        
        return this.generatePositions(count, side, 'icon');
    }

    generateOptimizedPositions(count, side) {
        console.log(`⚡ Using optimized positioning for ${count} elements on ${side} side`);
        
        const boundaries = this.renderer.boundaries[side];
        const positions = [];
        
        // Use grid-based approach for many elements
        const gridCols = Math.ceil(Math.sqrt(count));
        const gridRows = Math.ceil(count / gridCols);
        
        const cellWidth = (boundaries.horizontal.end - boundaries.horizontal.start) / gridCols;
        const cellHeight = (boundaries.vertical.end - boundaries.vertical.start) / gridRows;
        
        let elementIndex = 0;
        
        for (let row = 0; row < gridRows && elementIndex < count; row++) {
            for (let col = 0; col < gridCols && elementIndex < count; col++) {
                // Add randomness within each grid cell
                const baseX = boundaries.horizontal.start + (col * cellWidth);
                const baseY = boundaries.vertical.start + (row * cellHeight);
                
                const x = baseX + (Math.random() * cellWidth * 0.8) + (cellWidth * 0.1);
                const y = baseY + (Math.random() * cellHeight * 0.8) + (cellHeight * 0.1);
                
                positions.push({ x, y });
                elementIndex++;
            }
        }
        
        return positions;
    }

    // ===== CLEANUP =====
    
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        console.log('🛠️ Content helpers reset');
    }

    destroy() {
        this.reset();
        console.log('🛠️ Content helpers destroyed');
    }
}

// Add CSS for content effects if not already present
if (!document.querySelector('#content-helpers-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'content-helpers-styles';
    styleSheet.textContent = `
        @keyframes contentPulse {
            0%, 100% {
                transform: translate(-50%, 50%) scale(1);
            }
            50% {
                transform: translate(-50%, 50%) scale(1.1);
            }
        }
        
        @keyframes contentJiggle {
            0%, 100% { transform: translate(-50%, 50%) translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-50%, 50%) translateX(-3px); }
            20%, 40%, 60%, 80% { transform: translate(-50%, 50%) translateX(3px); }
        }
        
        .content-highlight {
            filter: drop-shadow(0 0 15px #ffd700) brightness(1.2);
            transform: translate(-50%, 50%) scale(1.1);
            transition: all 0.3s ease;
        }
        
        .content-glow {
            filter: drop-shadow(0 0 20px #4caf50);
            transition: filter 0.5s ease;
        }
    `;
    document.head.appendChild(styleSheet);
}

console.log('🛠️ Content helpers fully loaded with utilities and positioning algorithms');
