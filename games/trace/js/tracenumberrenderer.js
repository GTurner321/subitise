// Add these methods to your existing TraceNumberRenderer class

// Get the stroke path element for paint-fill system
getStrokePathElement(strokeIndex) {
    // Find the white path element that represents the stroke outline
    const strokeSelector = `.stroke-${strokeIndex}`;
    const strokePaths = this.svg.querySelectorAll(`${strokeSelector} path`);
    
    // Look for the white path (the one that creates the "hollow" effect)
    for (const path of strokePaths) {
        const fill = path.getAttribute('fill');
        const stroke = path.getAttribute('stroke');
        
        // Find the white path that creates the outline
        if (fill === 'white' || fill === '#FFFFFF') {
            console.log(`Found stroke ${strokeIndex} paint target:`, path);
            return path;
        }
    }
    
    console.error(`Could not find paint target for stroke ${strokeIndex}`);
    return null;
}

// Update paint progress (replaces updateTracingProgress)
updatePaintProgress(strokeIndex, completionRatio) {
    console.log(`Paint progress for stroke ${strokeIndex}: ${(completionRatio * 100).toFixed(1)}%`);
    
    // You could add visual feedback here, like changing the stroke color
    // or adding a progress indicator, but the paint itself provides the feedback
    
    // Store progress for completion checking
    if (!this.paintProgress) {
        this.paintProgress = {};
    }
    this.paintProgress[strokeIndex] = completionRatio;
    
    // Check if stroke is complete (80% painted = complete)
    if (completionRatio >= 0.8) {
        this.completeStroke(strokeIndex);
    }
}

// Enhanced stroke completion for paint system
completeStroke(strokeIndex) {
    console.log(`Stroke ${strokeIndex} completed via painting!`);
    
    // Mark stroke as complete
    this.completedStrokes.add(strokeIndex);
    
    // Add visual completion effect
    this.addStrokeCompletionEffect(strokeIndex);
    
    // Check if entire number is complete
    if (this.completedStrokes.size >= this.getStrokeCount()) {
        this.completeNumber();
    } else {
        // Move to next stroke
        this.currentStroke = strokeIndex + 1;
    }
}

// Add completion effect for painted stroke
addStrokeCompletionEffect(strokeIndex) {
    const strokePath = this.getStrokePathElement(strokeIndex);
    if (!strokePath) return;
    
    // Add a sparkle effect at the stroke location
    const bbox = strokePath.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Create sparkle group
    const sparkleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sparkleGroup.setAttribute('class', 'stroke-completion-sparkle');
    sparkleGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
    
    // Create multiple sparkle stars
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const angle = (i / 6) * Math.PI * 2;
        const distance = 20 + Math.random() * 15;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        sparkle.setAttribute('d', 'M-3,0 L0,-8 L3,0 L0,8 Z M0,-3 L8,0 L0,3 L-8,0 Z');
        sparkle.setAttribute('fill', '#FFD700');
        sparkle.setAttribute('transform', `translate(${x}, ${y}) scale(0.5)`);
        sparkle.setAttribute('opacity', '0');
        
        // Animate sparkle
        const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', '0;1;0');
        animateOpacity.setAttribute('dur', '1s');
        animateOpacity.setAttribute('begin', `${i * 0.1}s`);
        
        const animateScale = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateScale.setAttribute('attributeName', 'transform');
        animateScale.setAttribute('type', 'scale');
        animateScale.setAttribute('values', '0.5;1.2;0.3');
        animateScale.setAttribute('dur', '1s');
        animateScale.setAttribute('begin', `${i * 0.1}s`);
        
        sparkle.appendChild(animateOpacity);
        sparkle.appendChild(animateScale);
        sparkleGroup.appendChild(sparkle);
    }
    
    this.svg.appendChild(sparkleGroup);
    
    // Remove sparkles after animation
    setTimeout(() => {
        sparkleGroup.remove();
    }, 2000);
    
    console.log(`Added completion sparkle for stroke ${strokeIndex}`);
}

// Reset paint progress when starting new number
reset() {
    // Call existing reset logic first
    // ... existing reset code ...
    
    // Reset paint-specific state
    this.paintProgress = {};
    
    // Remove any paint groups
    const paintGroups = this.svg.querySelectorAll('[class^="paint-group-"]');
    paintGroups.forEach(group => group.remove());
    
    // Remove paint masks
    const paintMasks = this.svg.querySelectorAll('[id^="paint-mask-"]');
    paintMasks.forEach(mask => mask.remove());
    
    console.log('Paint system reset complete');
}

// Get current paint completion for a stroke
getPaintCompletion(strokeIndex) {
    if (!this.paintProgress) return 0;
    return this.paintProgress[strokeIndex] || 0;
}

// Check if stroke is ready for painting
isStrokeReadyForPainting(strokeIndex) {
    // Must be current stroke or previous strokes must be complete
    if (strokeIndex === 0) return true;
    
    // Check if previous stroke is complete
    return this.completedStrokes.has(strokeIndex - 1);
}

// Enhanced number rendering for paint system
renderNumber(number) {
    // Call existing renderNumber logic first
    const success = this.renderNumberOriginal(number); // You'll need to rename existing method
    
    if (success) {
        // Initialize paint system state
        this.paintProgress = {};
        this.currentStroke = 0;
        
        console.log(`Number ${number} rendered and ready for painting`);
    }
    
    return success;
}

// Debug method to highlight paintable areas
showPaintableAreas() {
    if (!CONFIG.DEBUG_MODE) return;
    
    for (let i = 0; i < this.getStrokeCount(); i++) {
        const strokePath = this.getStrokePathElement(i);
        if (strokePath) {
            const bbox = strokePath.getBBox();
            
            const debugRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            debugRect.setAttribute('x', bbox.x);
            debugRect.setAttribute('y', bbox.y);
            debugRect.setAttribute('width', bbox.width);
            debugRect.setAttribute('height', bbox.height);
            debugRect.setAttribute('fill', 'rgba(0, 255, 0, 0.2)');
            debugRect.setAttribute('stroke', 'green');
            debugRect.setAttribute('stroke-width', 1);
            debugRect.setAttribute('class', 'debug-paintable-area');
            
            this.svg.appendChild(debugRect);
        }
    }
}
