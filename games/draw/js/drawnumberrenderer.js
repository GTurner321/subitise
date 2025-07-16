class DrawNumberRenderer {
    constructor() {
        this.referenceSvg = null;
        this.drawingSvg = null;
        this.referenceContainer = null;
        this.drawingContainer = null;
        this.currentNumber = null;
        this.scaledReferenceCoords = [];
        this.scaledDrawingCoords = [];
        this.userDrawnPaths = [];
        this.isDrawing = false;
        this.currentDrawnPath = [];
        this.coveredPoints = new Set(); // Track which points have been covered
        this.pencilIcon = null;
        this.handleResize = null;
    }

    initialize(referenceContainerId, drawingContainerId) {
        console.log('Initializing renderer with containers:', referenceContainerId, drawingContainerId);
        
        this.referenceContainer = document.getElementById(referenceContainerId);
        this.drawingContainer = document.getElementById(drawingContainerId);
        
        if (!this.referenceContainer || !this.drawingContainer) {
            console.error('Containers not found');
            return false;
        }
        
        this.createSVGs();
        this.createPencilIcon();
        
        // Add window resize handler
        this.handleResize = () => {
            if (this.referenceSvg && this.drawingSvg) {
                this.updateSVGDimensions();
                if (this.currentNumber !== null) {
                    this.renderNumber(this.currentNumber);
                }
            }
        };
        window.addEventListener('resize', this.handleResize);
        
        // Set up drawing event listeners
        this.setupDrawingEvents();
        
        console.log('SVGs created');
        return true;
    }

    createSVGs() {
        // Clear existing content
        this.referenceContainer.innerHTML = '';
        this.drawingContainer.innerHTML = '';
        
        // Create reference SVG (left side - smaller)
        this.referenceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.referenceSvg.setAttribute('class', 'reference-svg');
        
        // Create drawing SVG (right side - larger)
        this.drawingSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.drawingSvg.setAttribute('class', 'drawing-svg');
        
        this.updateSVGDimensions();
        
        this.referenceContainer.appendChild(this.referenceSvg);
        this.drawingContainer.appendChild(this.drawingSvg);
    }

    updateSVGDimensions() {
        // Reference SVG dimensions (smaller) - use same system as trace game
        const refWidth = DRAW_CONFIG.REFERENCE_WIDTH;
        const refHeight = DRAW_CONFIG.REFERENCE_HEIGHT;
        this.referenceSvg.setAttribute('viewBox', `0 0 ${refWidth} ${refHeight}`);
        this.referenceSvg.setAttribute('width', '100%');
        this.referenceSvg.setAttribute('height', '100%');
        
        // Drawing SVG dimensions (larger)
        const drawWidth = DRAW_CONFIG.DRAWING_WIDTH;
        const drawHeight = DRAW_CONFIG.DRAWING_HEIGHT;
        this.drawingSvg.setAttribute('viewBox', `0 0 ${drawWidth} ${drawHeight}`);
        this.drawingSvg.setAttribute('width', '100%');
        this.drawingSvg.setAttribute('height', '100%');
    }

    createPencilIcon() {
        // Create pencil icon for drawing area
        this.pencilIcon = document.createElement('i');
        this.pencilIcon.className = 'fa-solid fa-pencil pencil-icon';
        this.pencilIcon.style.position = 'absolute';
        this.pencilIcon.style.top = '20px';
        this.pencilIcon.style.right = '20px';
        this.pencilIcon.style.fontSize = '24px';
        this.pencilIcon.style.color = '#666';
        this.pencilIcon.style.opacity = '0.7';
        this.pencilIcon.style.pointerEvents = 'none';
        this.pencilIcon.style.zIndex = '10';
        this.pencilIcon.style.transition = 'opacity 0.3s ease';
        
        // Create undo button
        this.undoButton = document.createElement('button');
        this.undoButton.innerHTML = '<i class="fas fa-undo"></i>';
        this.undoButton.className = 'undo-button';
        this.undoButton.style.position = 'absolute';
        this.undoButton.style.top = '20px';
        this.undoButton.style.right = '60px';
        this.undoButton.style.width = '50px';
        this.undoButton.style.height = '50px';
        this.undoButton.style.borderRadius = '50%';
        this.undoButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.undoButton.style.color = 'white';
        this.undoButton.style.border = 'none';
        this.undoButton.style.fontSize = '20px';
        this.undoButton.style.cursor = 'pointer';
        this.undoButton.style.transition = 'all 0.3s ease';
        this.undoButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        this.undoButton.style.zIndex = '10';
        this.undoButton.style.display = 'flex';
        this.undoButton.style.alignItems = 'center';
        this.undoButton.style.justifyContent = 'center';
        
        // Hover effects
        this.undoButton.addEventListener('mouseenter', () => {
            this.undoButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            this.undoButton.style.transform = 'scale(1.1)';
        });
        
        this.undoButton.addEventListener('mouseleave', () => {
            this.undoButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.undoButton.style.transform = 'scale(1)';
        });
        
        // Click handler
        this.undoButton.addEventListener('click', () => this.undoLastPath());
        this.undoButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.undoLastPath();
        });
        
        this.drawingContainer.style.position = 'relative';
        this.drawingContainer.appendChild(this.pencilIcon);
        this.drawingContainer.appendChild(this.undoButton);
    }

    undoLastPath() {
        if (this.userDrawnPaths.length > 0) {
            // Remove last path from array
            this.userDrawnPaths.pop();
            
            // Remove last path from SVG
            const userPaths = this.drawingSvg.querySelectorAll('.user-drawn-path');
            if (userPaths.length > 0) {
                userPaths[userPaths.length - 1].remove();
            }
            
            // Recalculate coverage
            this.recalculateCoverage();
            
            // Show pencil icon again if no paths left
            if (this.userDrawnPaths.length === 0 && this.pencilIcon) {
                this.pencilIcon.style.opacity = '0.7';
            }
        }
    }

    recalculateCoverage() {
        // Reset coverage points
        this.coveredPoints.clear();
        
        // Recalculate coverage based on remaining paths
        this.userDrawnPaths.forEach(path => {
            path.forEach(point => {
                this.checkDrawingProgress(point);
            });
        });
    }

    renderNumber(number) {
        if (number < 0 || number > 9) {
            console.error('Invalid number:', number);
            return false;
        }
        
        this.currentNumber = number;
        this.clearSVGs();
        this.scaledReferenceCoords = [];
        this.scaledDrawingCoords = [];
        this.userDrawnPaths = [];
        this.currentDrawnPath = [];
        this.coveredPoints.clear();
        
        // Show pencil icon again
        if (this.pencilIcon) {
            this.pencilIcon.style.opacity = '0.7';
        }
        
        const numberConfig = DRAW_CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            console.error('No stroke definition found for number:', number);
            return false;
        }
        
        console.log(`Rendering number ${number} with ${numberConfig.strokes.length} stroke(s)`);
        
        try {
            // Process and scale coordinates for both SVGs
            this.processCoordinates(numberConfig.strokes);
            
            // Create reference number (left side - normal thickness)
            this.createReferenceNumber(numberConfig.strokes);
            
            // Create drawing template (right side - thick grey outline)
            this.createDrawingTemplate(numberConfig.strokes);
            
            console.log(`Successfully rendered number ${number}`);
            return true;
        } catch (error) {
            console.error('Error rendering number:', number, error);
            return false;
        }
    }

    processCoordinates(strokes) {
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && stroke.coordinates) {
                const refScaledCoords = this.scaleCoordinatesForReference(stroke.coordinates);
                const drawScaledCoords = this.scaleCoordinatesForDrawing(stroke.coordinates);
                
                this.scaledReferenceCoords[strokeIndex] = refScaledCoords;
                this.scaledDrawingCoords[strokeIndex] = drawScaledCoords;
                
                console.log(`Processed ${refScaledCoords.length} coordinates for stroke ${strokeIndex}`);
            }
        });
    }

    scaleCoordinatesForReference(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            console.error('No coordinates provided to scaleCoordinatesForReference');
            return [];
        }
        
        // Use same scaling system as trace game - SAME scale for both X and Y
        const minDimension = Math.min(DRAW_CONFIG.REFERENCE_WIDTH, DRAW_CONFIG.REFERENCE_HEIGHT);
        const scale = minDimension / 200;  // Use 200 as base since coordinates go 0-200
        
        const offsetX = (DRAW_CONFIG.REFERENCE_WIDTH - 120 * scale) / 2;
        const offsetY = (DRAW_CONFIG.REFERENCE_HEIGHT - 200 * scale) / 2;
        
        console.log('Reference scaling:', { scale, offsetX, offsetY });
        
        return coordinates.map((coord, index) => {
            const scaledX = offsetX + (coord.x * scale);
            // Flip Y coordinate: SVG Y increases downward, coordinates Y increases upward
            const scaledY = offsetY + ((200 - coord.y) * scale);
            
            // Log first few coordinates for debugging
            if (index < 3) {
                console.log(`Reference coord ${index}: (${coord.x}, ${coord.y}) → (${scaledX}, ${scaledY})`);
            }
            
            return { x: scaledX, y: scaledY };
        });
    }

    scaleCoordinatesForDrawing(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            console.error('No coordinates provided to scaleCoordinatesForDrawing');
            return [];
        }
        
        // Use same scaling system as trace game - SAME scale for both X and Y
        const minDimension = Math.min(DRAW_CONFIG.DRAWING_WIDTH, DRAW_CONFIG.DRAWING_HEIGHT);
        const scale = minDimension / 200;  // Use 200 as base since coordinates go 0-200
        
        const offsetX = (DRAW_CONFIG.DRAWING_WIDTH - 120 * scale) / 2;
        const offsetY = (DRAW_CONFIG.DRAWING_HEIGHT - 200 * scale) / 2;
        
        console.log('Drawing scaling:', { scale, offsetX, offsetY });
        
        return coordinates.map((coord, index) => {
            const scaledX = offsetX + (coord.x * scale);
            // Flip Y coordinate: SVG Y increases downward, coordinates Y increases upward
            const scaledY = offsetY + ((200 - coord.y) * scale);
            
            // Log first few coordinates for debugging
            if (index < 3) {
                console.log(`Drawing coord ${index}: (${coord.x}, ${coord.y}) → (${scaledX}, ${scaledY})`);
            }
            
            return { x: scaledX, y: scaledY };
        });
    }

    createReferenceNumber(strokes) {
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && this.scaledReferenceCoords[strokeIndex]) {
                const coords = this.scaledReferenceCoords[strokeIndex];
                
                let pathData = '';
                coords.forEach((coord, index) => {
                    if (index === 0) {
                        pathData += `M ${coord.x} ${coord.y}`;
                    } else {
                        pathData += ` L ${coord.x} ${coord.y}`;
                    }
                });
                
                console.log(`Reference path data for stroke ${strokeIndex}:`, pathData.substring(0, 100) + '...');
                
                // Create black outline
                const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                outlinePath.setAttribute('d', pathData);
                outlinePath.setAttribute('stroke', DRAW_CONFIG.REFERENCE_OUTLINE_COLOR);
                outlinePath.setAttribute('stroke-width', DRAW_CONFIG.REFERENCE_OUTLINE_WIDTH);
                outlinePath.setAttribute('fill', 'none');
                outlinePath.setAttribute('stroke-linecap', 'round');
                outlinePath.setAttribute('stroke-linejoin', 'round');
                this.referenceSvg.appendChild(outlinePath);
                
                // Create white interior
                const interiorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                interiorPath.setAttribute('d', pathData);
                interiorPath.setAttribute('stroke', 'white');
                interiorPath.setAttribute('stroke-width', DRAW_CONFIG.REFERENCE_WHITE_WIDTH);
                interiorPath.setAttribute('fill', 'none');
                interiorPath.setAttribute('stroke-linecap', 'round');
                interiorPath.setAttribute('stroke-linejoin', 'round');
                this.referenceSvg.appendChild(interiorPath);
            }
        });
    }

    createDrawingTemplate(strokes) {
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && this.scaledDrawingCoords[strokeIndex]) {
                const coords = this.scaledDrawingCoords[strokeIndex];
                
                let pathData = '';
                coords.forEach((coord, index) => {
                    if (index === 0) {
                        pathData += `M ${coord.x} ${coord.y}`;
                    } else {
                        pathData += ` L ${coord.x} ${coord.y}`;
                    }
                });
                
                console.log(`Drawing path data for stroke ${strokeIndex}:`, pathData.substring(0, 100) + '...');
                
                // Create thick grey outline for drawing template
                const templatePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                templatePath.setAttribute('d', pathData);
                templatePath.setAttribute('stroke', DRAW_CONFIG.DRAWING_OUTLINE_COLOR);
                templatePath.setAttribute('stroke-width', DRAW_CONFIG.DRAWING_OUTLINE_WIDTH);
                templatePath.setAttribute('fill', 'none');
                templatePath.setAttribute('stroke-linecap', 'round');
                templatePath.setAttribute('stroke-linejoin', 'round');
                templatePath.setAttribute('class', `template-outline-${strokeIndex}`);
                this.drawingSvg.appendChild(templatePath);
                
                // Create large white interior for drawing area
                const drawingAreaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                drawingAreaPath.setAttribute('d', pathData);
                drawingAreaPath.setAttribute('stroke', 'white');
                drawingAreaPath.setAttribute('stroke-width', DRAW_CONFIG.DRAWING_WHITE_WIDTH);
                drawingAreaPath.setAttribute('fill', 'none');
                drawingAreaPath.setAttribute('stroke-linecap', 'round');
                drawingAreaPath.setAttribute('stroke-linejoin', 'round');
                drawingAreaPath.setAttribute('class', `drawing-area-${strokeIndex}`);
                this.drawingSvg.appendChild(drawingAreaPath);
            }
        });
    }

    setupDrawingEvents() {
        if (!this.drawingSvg) return;
        
        // Only allow drawing in the drawing SVG area
        // Mouse events
        this.drawingSvg.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawingSvg.addEventListener('mousemove', (e) => this.continueDrawing(e));
        this.drawingSvg.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.drawingSvg.addEventListener('mouseleave', (e) => this.stopDrawing(e));
        
        // Touch events
        this.drawingSvg.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
        this.drawingSvg.addEventListener('touchmove', (e) => this.continueDrawing(e), { passive: false });
        this.drawingSvg.addEventListener('touchend', (e) => this.stopDrawing(e));
        this.drawingSvg.addEventListener('touchcancel', (e) => this.stopDrawing(e));
        
        // Set custom cursor for drawing area
        this.drawingSvg.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewport=\'0 0 20 20\'><circle cx=\'10\' cy=\'10\' r=\'2\' fill=\'%234CAF50\'/></svg>") 10 10, crosshair';
    }

    startDrawing(event) {
        event.preventDefault();
        this.isDrawing = true;
        this.currentDrawnPath = [];
        
        // Hide pencil icon when user starts drawing
        if (this.pencilIcon) {
            this.pencilIcon.style.opacity = '0';
        }
        
        const point = this.getEventPoint(event, this.drawingSvg);
        if (point) {
            this.currentDrawnPath.push(point);
            this.createNewDrawnPath();
        }
    }

    continueDrawing(event) {
        if (!this.isDrawing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event, this.drawingSvg);
        if (point) {
            this.currentDrawnPath.push(point);
            this.updateCurrentDrawnPath();
            this.checkDrawingProgress(point);
        }
    }

    stopDrawing(event) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentDrawnPath.length > 0) {
            this.userDrawnPaths.push([...this.currentDrawnPath]);
            this.currentDrawnPath = [];
        }
        
        // Check if drawing is complete
        this.checkDrawingCompletion();
    }

    getEventPoint(event, svg) {
        const rect = svg.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.type.startsWith('touch')) {
            if (event.touches.length === 0) return null;
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const scaleX = DRAW_CONFIG.DRAWING_WIDTH / rect.width;
        const scaleY = DRAW_CONFIG.DRAWING_HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    createNewDrawnPath() {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', DRAW_CONFIG.DRAWING_STROKE_COLOR);
        path.setAttribute('stroke-width', DRAW_CONFIG.DRAWING_STROKE_WIDTH);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('class', 'user-drawn-path');
        
        this.drawingSvg.appendChild(path);
        this.updateCurrentDrawnPath();
    }

    updateCurrentDrawnPath() {
        if (this.currentDrawnPath.length === 0) return;
        
        const path = this.drawingSvg.querySelector('.user-drawn-path:last-child');
        if (!path) return;
        
        let pathData = '';
        this.currentDrawnPath.forEach((point, index) => {
            if (index === 0) {
                pathData += `M ${point.x} ${point.y}`;
            } else {
                pathData += ` L ${point.x} ${point.y}`;
            }
        });
        
        path.setAttribute('d', pathData);
    }

    checkDrawingProgress(drawnPoint) {
        // Check if the drawn point is close to any of the template coordinates
        for (let strokeIndex = 0; strokeIndex < this.scaledDrawingCoords.length; strokeIndex++) {
            const coords = this.scaledDrawingCoords[strokeIndex];
            if (!coords) continue;
            
            for (let coordIndex = 0; coordIndex < coords.length; coordIndex++) {
                const templatePoint = coords[coordIndex];
                const distance = Math.sqrt(
                    Math.pow(drawnPoint.x - templatePoint.x, 2) + 
                    Math.pow(drawnPoint.y - templatePoint.y, 2)
                );
                
                if (distance <= DRAW_CONFIG.DRAWING_TOLERANCE) {
                    const pointKey = `${strokeIndex}-${coordIndex}`;
                    this.coveredPoints.add(pointKey);
                }
            }
        }
    }

    checkDrawingCompletion() {
        const totalPoints = this.getTotalTemplatePoints();
        const coveragePercentage = (this.coveredPoints.size / totalPoints) * 100;
        
        console.log(`Drawing coverage: ${coveragePercentage.toFixed(1)}% (${this.coveredPoints.size}/${totalPoints} points)`);
        
        if (coveragePercentage >= DRAW_CONFIG.MIN_COVERAGE_PERCENTAGE) {
            this.completeNumber();
        }
    }

    getTotalTemplatePoints() {
        let total = 0;
        for (let strokeIndex = 0; strokeIndex < this.scaledDrawingCoords.length; strokeIndex++) {
            const coords = this.scaledDrawingCoords[strokeIndex];
            if (coords) {
                total += coords.length;
            }
        }
        return total;
    }

    completeNumber() {
        console.log(`Number ${this.currentNumber} drawing completed!`);
        
        // Show next button or trigger completion
        if (window.drawGame && typeof window.drawGame.handleNumberCompletion === 'function') {
            window.drawGame.handleNumberCompletion();
        }
    }

    clearDrawing() {
        // Remove all user-drawn paths
        const userPaths = this.drawingSvg.querySelectorAll('.user-drawn-path');
        userPaths.forEach(path => path.remove());
        
        this.userDrawnPaths = [];
        this.currentDrawnPath = [];
        this.coveredPoints.clear();
        this.isDrawing = false;
        
        // Show pencil icon again
        if (this.pencilIcon) {
            this.pencilIcon.style.opacity = '0.7';
        }
    }

    clearSVGs() {
        // Clear reference SVG
        while (this.referenceSvg.firstChild) {
            this.referenceSvg.removeChild(this.referenceSvg.firstChild);
        }
        
        // Clear drawing SVG
        while (this.drawingSvg.firstChild) {
            this.drawingSvg.removeChild(this.drawingSvg.firstChild);
        }
    }

    reset() {
        this.currentNumber = null;
        this.scaledReferenceCoords = [];
        this.scaledDrawingCoords = [];
        this.userDrawnPaths = [];
        this.currentDrawnPath = [];
        this.coveredPoints.clear();
        this.isDrawing = false;
        
        if (this.referenceSvg && this.drawingSvg) {
            this.clearSVGs();
        }
        
        // Show pencil icon again
        if (this.pencilIcon) {
            this.pencilIcon.style.opacity = '0.7';
        }
    }

    destroy() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            this.handleResize = null;
        }
        this.reset();
    }
}
