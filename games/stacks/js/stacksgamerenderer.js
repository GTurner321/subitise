/**
 * StacksGameRenderer - Main game coordination, logic, and animations
 * Orchestrates ElementManager and DragDropHandler to create complete game experience
 */
class StacksGameRenderer {
    constructor(svg, gameController) {
        this.svg = svg;
        this.gameController = gameController;
        
        // Initialize component managers
        this.elementManager = new StacksElementManager(svg);
        this.dragHandler = new StacksDragDropHandler(svg, this);
        
        // Bind methods for event handling
        this.handleResize = this.handleResize.bind(this);
        this.onBlockMoved = this.onBlockMoved.bind(this);
        
        console.log('StacksGameRenderer initialized with component architecture');
    }
    
    /**
     * Handle window resize events
     */
    handleResize() {
        if (this.elementManager) {
            this.elementManager.handleResize();
        }
    }
    
    /**
     * Main rendering method - creates tower with blocks and containers
     */
    renderTowerWithPositions(blocks, containers, containerPositions, blockPositions, isWide = false) {
        // Clear only NEW tower elements
        this.clearNewTowerElements();
        
        // Check if we need wide blocks
        const hasThreeDigitNumbers = blocks.some(block => block.number >= 100);
        const useWideBlocks = isWide || hasThreeDigitNumbers;
        
        // Render containers using ElementManager
        containerPositions.forEach((position, index) => {
            const containerElement = this.elementManager.createContainer(position.x, position.y, index, useWideBlocks);
            containerElement.classList.add('new-tower-element');
            containerElement.style.pointerEvents = 'auto';
            containerElement.style.opacity = STACKS_CONFIG.CONTAINER_OPACITY;
            this.svg.appendChild(containerElement);
        });
        
        // Render blocks using ElementManager
        blockPositions.forEach((position, index) => {
            const block = blocks[index];
            const blockElement = this.elementManager.createBlock(
                block.number, 
                position.x, 
                position.y, 
                block.color,
                useWideBlocks
            );
            blockElement.classList.add('new-tower-element');
            this.svg.appendChild(blockElement);
        });
        
        console.log('Tower rendered with', containerPositions.length, 'containers and', blockPositions.length, 'blocks');
    }
    
    /**
     * Clear all new tower elements
     */
    clearNewTowerElements() {
        if (this.elementManager) {
            this.elementManager.clearNewTowerElements();
        }
    }
    
    /**
     * Hide current tower containers (called when tower is completed)
     */
    hideCurrentTowerContainers() {
        console.log('=== HIDING TOWER CONTAINERS ===');
        const containers = this.svg.querySelectorAll('.container.new-tower-element');
        console.log('Found', containers.length, 'containers to hide');
        
        containers.forEach((container, index) => {
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.3s ease';
            console.log('Hiding container', index);
        });
        
        console.log('=== CONTAINERS HIDDEN ===');
    }
    
    /**
     * Clear entire tower (all elements)
     */
    clearTower() {
        if (this.elementManager) {
            this.elementManager.clearAllElements();
        }
    }
    
    /**
     * Create teddy bear for completed tower
     */
    createTeddy(xPercent, yPercent, imageUrl) {
        if (this.elementManager) {
            return this.elementManager.createTeddy(xPercent, yPercent, imageUrl);
        }
        return null;
    }
    
    /**
     * Event handler for when a block is moved (called by DragDropHandler)
     */
    onBlockMoved() {
        console.log('Block moved, checking tower completion...');
        
        // Check if tower is complete and correct
        if (this.isValidTowerOrder()) {
            console.log('🎉 Tower is complete and correct!');
            // Notify game controller
            if (this.gameController && this.gameController.onBlockMoved) {
                this.gameController.onBlockMoved();
            }
        } else {
            console.log('Tower not yet complete or incorrect order');
        }
    }
    
    /**
     * Validate if tower is correctly ordered (bottom to top, ascending numbers)
     */
    isValidTowerOrder() {
        console.log('=== CHECKING TOWER ORDER ===');
        
        const containers = Array.from(this.svg.querySelectorAll('.container.new-tower-element')).sort((a, b) => 
            parseFloat(b.getAttribute('y')) - parseFloat(a.getAttribute('y')) // Bottom to top
        );
        
        console.log('Found', containers.length, 'containers to check');
        
        if (containers.length === 0) {
            console.log('No containers found - tower invalid');
            return false;
        }
        
        const towerNumbers = [];
        let emptyContainers = 0;
        
        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const block = this.getBlockInContainer(container);
            
            if (block) {
                const number = parseInt(block.getAttribute('data-number'));
                towerNumbers.push(number);
                console.log(`Container ${i} (index ${container.getAttribute('data-index')}): block ${number}`);
            } else {
                emptyContainers++;
                console.log(`Container ${i} (index ${container.getAttribute('data-index')}): EMPTY`);
            }
        }
        
        if (emptyContainers > 0) {
            console.log(`Tower incomplete: ${emptyContainers} empty containers`);
            return false;
        }
        
        console.log('Tower numbers (bottom to top):', towerNumbers);
        
        // Check if numbers are in ascending order (bottom to top)
        for (let i = 1; i < towerNumbers.length; i++) {
            if (towerNumbers[i] <= towerNumbers[i-1]) {
                console.log(`Numbers not in ascending order: ${towerNumbers[i]} <= ${towerNumbers[i-1]} at position ${i}`);
                return false;
            }
        }
        
        console.log('✅ Tower is valid and complete!');
        console.log('=== TOWER CHECK COMPLETE ===');
        return true;
    }
    
    /**
     * Highlight correct tower order with visual effects
     */
    highlightCorrectOrder() {
        const blocks = this.getTowerBlocks();
        blocks.forEach(block => {
            if (block._rect) {
                block._rect.setAttribute('stroke', '#4CAF50');
                setTimeout(() => {
                    block._rect.setAttribute('stroke', '#333');
                }, 1000);
            }
        });
    }
    
    /**
     * Animate completed tower to side position
     */
    animateCompletedTower(towerBlocks, teddy, targetXPercent, callback) {
        const duration = STACKS_CONFIG.BLOCK_ANIMATION_DURATION;
        const targetX = vwToPx(targetXPercent);
        const currentCenterX = vwToPx(STACKS_CONFIG.TOWER_CENTER_X_PERCENT);
        const deltaX = targetX - currentCenterX;
        
        // Only animate blocks that are NOT already completed towers
        const elementsToAnimate = towerBlocks.filter(block => !block.classList.contains('completed-tower'));
        if (teddy && !teddy.classList.contains('completed-tower')) {
            elementsToAnimate.push(teddy);
        }
        
        console.log('Animating', elementsToAnimate.length, 'elements to position', targetXPercent + '%');
        
        elementsToAnimate.forEach(element => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            if (element.classList.contains('block')) {
                const newX = element._centerX + deltaX;
                
                // Update position via ElementManager
                if (this.elementManager) {
                    this.elementManager.updateBlockPosition(element, newX, element._centerY);
                }
                
                // Mark as completed tower
                element.classList.add('completed-tower');
                element.classList.remove('new-tower-element');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                element.style.pointerEvents = 'none';
                element.style.cursor = 'default';
                
                // Lock the final position
                element._isLocked = true;
                element._finalX = newX;
                element._finalY = element._centerY;
                
            } else if (element.classList.contains('teddy')) {
                // Handle both image teddies and fallback teddy groups
                const newCenterX = element._centerX + deltaX;
                
                if (element.tagName === 'image') {
                    const currentTeddyX = parseFloat(element.getAttribute('x'));
                    const newTeddyX = currentTeddyX + deltaX;
                    element.setAttribute('x', newTeddyX);
                } else if (element.tagName === 'g') {
                    // Fallback teddy group - move all child elements
                    const children = element.children;
                    for (let child of children) {
                        if (child.tagName === 'circle') {
                            const currentX = parseFloat(child.getAttribute('cx'));
                            child.setAttribute('cx', currentX + deltaX);
                        }
                    }
                }
                
                // Update stored coordinates (BOTH pixels and percentages)
                element._centerX = newCenterX;
                element._xPercent = pxToVw(newCenterX);
                
                // Mark teddy as completed tower element
                element.classList.add('completed-tower');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                element._isLocked = true;
                element._finalX = newCenterX;
            }
        });
        
        // Clear transitions after animation
        setTimeout(() => {
            elementsToAnimate.forEach(element => {
                element.style.transition = '';
            });
            if (callback) callback();
            console.log('Tower animation complete');
        }, duration);
    }
    
    /**
     * Get block in specific container
     */
    getBlockInContainer(container) {
        const blocks = this.svg.querySelectorAll('.block');
        for (let block of blocks) {
            if (block._container === container) {
                return block;
            }
        }
        return null;
    }
    
    /**
     * Get container for specific block
     */
    getContainerForBlock(block) {
        return block._container || null;
    }
    
    /**
     * Get all blocks currently in tower containers
     */
    getTowerBlocks() {
        if (this.dragHandler) {
            return this.dragHandler.getTowerBlocks();
        }
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => block._container);
    }
    
    /**
     * Get all blocks not in containers (ground blocks)
     */
    getGroundBlocks() {
        if (this.dragHandler) {
            return this.dragHandler.getGroundBlocks();
        }
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => !block._container);
    }
    
    /**
     * Get all blocks in the SVG
     */
    getAllBlocks() {
        if (this.elementManager) {
            return this.elementManager.getAllBlocks();
        }
        return Array.from(this.svg.querySelectorAll('.block'));
    }
    
    /**
     * Get all containers in the SVG
     */
    getAllContainers() {
        if (this.elementManager) {
            return this.elementManager.getAllContainers();
        }
        return Array.from(this.svg.querySelectorAll('.container'));
    }
    
    /**
     * Get all teddies in the SVG
     */
    getAllTeddies() {
        if (this.elementManager) {
            return this.elementManager.getAllTeddies();
        }
        return Array.from(this.svg.querySelectorAll('.teddy'));
    }
    
    /**
     * Check if currently dragging a block
     */
    isDragging() {
        if (this.dragHandler) {
            return this.dragHandler.isDraggingBlock();
        }
        return false;
    }
    
    /**
     * Get currently dragged element
     */
    getDraggedElement() {
        if (this.dragHandler) {
            return this.dragHandler.getDraggedElement();
        }
        return null;
    }
    
    /**
     * Restore all completed towers to full opacity (called at game end)
     */
    restoreAllTowersOpacity() {
        // Restore all completed tower blocks to full opacity
        const completedBlocks = this.svg.querySelectorAll('.block.completed-tower');
        completedBlocks.forEach(block => {
            block.style.opacity = '1';
        });
        
        // Restore all completed teddies to full opacity  
        const completedTeddies = this.svg.querySelectorAll('.teddy.completed-tower');
        completedTeddies.forEach(teddy => {
            teddy.style.opacity = '1';
        });
        
        console.log('All towers restored to full opacity');
    }
    
    /**
     * Apply visual flash effect for successful completion
     */
    showSuccessFlash() {
        // Add success flash to the game area
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.add('success-flash');
            setTimeout(() => {
                gameArea.classList.remove('success-flash');
            }, 500);
        }
    }
    
    /**
     * Apply visual flash effect for incorrect attempt
     */
    showFailureFlash() {
        // Add failure flash to the game area
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.add('failure-flash');
            setTimeout(() => {
                gameArea.classList.remove('failure-flash');
            }, 500);
        }
    }
    
    /**
     * Create completion effect stars around the tower
     */
    createCompletionEffect(centerX, centerY) {
        const starCount = 8;
        const radius = vwToPx(15); // 15% of viewport width
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            star.textContent = '⭐';
            star.setAttribute('class', 'completion-effect');
            star.setAttribute('font-size', vhToPx(4)); // 4% of viewport height
            star.style.pointerEvents = 'none';
            
            // Calculate position around the tower
            const angle = (i / starCount) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            star.setAttribute('x', x);
            star.setAttribute('y', y);
            star.setAttribute('text-anchor', 'middle');
            star.setAttribute('dominant-baseline', 'central');
            
            // Animation
            star.style.opacity = '0';
            star.style.transform = 'scale(0)';
            star.style.transition = 'all 0.5s ease-out';
            star.style.animationDelay = (i * 0.1) + 's';
            
            this.svg.appendChild(star);
            
            // Trigger animation
            setTimeout(() => {
                star.style.opacity = '1';
                star.style.transform = 'scale(1)';
            }, i * 100);
            
            // Remove after animation
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 2000 + (i * 100));
        }
    }
    
    /**
     * Debug method to log current game state
     */
    debugGameState() {
        console.log('=== GAME STATE DEBUG ===');
        console.log('Total blocks:', this.getAllBlocks().length);
        console.log('Total containers:', this.getAllContainers().length);
        console.log('Tower blocks:', this.getTowerBlocks().length);
        console.log('Ground blocks:', this.getGroundBlocks().length);
        console.log('Is dragging:', this.isDragging());
        console.log('Completed towers:', this.svg.querySelectorAll('.block.completed-tower').length);
        
        // Log block positions
        this.getAllBlocks().forEach((block, index) => {
            console.log(`Block ${index} (${block.getAttribute('data-number')}):`, {
                inContainer: !!block._container,
                position: { x: block._xPercent, y: block._yPercent },
                isLocked: !!block._isLocked
            });
        });
        console.log('=== END DEBUG ===');
    }
    
    /**
     * Get game statistics for analysis
     */
    getGameStats() {
        return {
            totalBlocks: this.getAllBlocks().length,
            towerBlocks: this.getTowerBlocks().length,
            groundBlocks: this.getGroundBlocks().length,
            completedTowers: this.svg.querySelectorAll('.block.completed-tower').length,
            containers: this.getAllContainers().length,
            teddies: this.getAllTeddies().length,
            isDragging: this.isDragging(),
            isValidTower: this.getTowerBlocks().length > 0 ? this.isValidTowerOrder() : false
        };
    }
    
    /**
     * Export tower configuration for saving/loading
     */
    exportTowerState() {
        const towerBlocks = this.getTowerBlocks();
        const groundBlocks = this.getGroundBlocks();
        
        return {
            tower: towerBlocks.map(block => ({
                number: parseInt(block.getAttribute('data-number')),
                containerIndex: block._container ? parseInt(block._container.getAttribute('data-index')) : null,
                position: { x: block._xPercent, y: block._yPercent }
            })),
            ground: groundBlocks.map(block => ({
                number: parseInt(block.getAttribute('data-number')),
                position: { x: block._xPercent, y: block._yPercent }
            }))
        };
    }
    
    /**
     * Clean up and destroy the renderer
     */
    destroy() {
        console.log('Destroying StacksGameRenderer');
        
        // Destroy component managers
        if (this.dragHandler) {
            this.dragHandler.destroy();
            this.dragHandler = null;
        }
        
        if (this.elementManager) {
            this.elementManager.destroy();
            this.elementManager = null;
        }
        
        // Clear any remaining elements
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        console.log('StacksGameRenderer destroyed');
    }
}
