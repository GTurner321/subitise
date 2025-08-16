/**
 * Raisin Animation Renderer
 * Handles guinea pig animations, movements, and eating sequences.
 * Works with RaisinPositionRenderer which handles raisin placement and rendering.
 * This file focuses on: guinea pig sizing, movement animations, eating logic,
 * audio playback for guinea pig sounds, and coordinating the eating sequence.
 */
class RaisinAnimationRenderer {
    constructor(positionRenderer) {
        console.log('🐹 RaisinAnimationRenderer initialized');
        this.positionRenderer = positionRenderer;
        this.gameArea = document.querySelector('.game-area');
        
        // Guinea pig DOM elements
        this.guineaPig3 = document.getElementById('guineaPig3');
        this.guineaPig2 = document.getElementById('guineaPig2');
        this.guineaPig1 = document.getElementById('guineaPig1');
        
        // Audio elements
        this.guineaPigAudio = null;
        this.guineaPigSoundInterval = null;
        
        // Debug: Log initial state of guinea pig elements
        console.log('🐹 Guinea pig elements found:', {
            gp3: !!this.guineaPig3,
            gp2: !!this.guineaPig2,
            gp1: !!this.guineaPig1
        });
        
        this.initializeAudio();
        this.setupResizeHandling();
        
        // Wait for game area to be sized by ButtonBar
        setTimeout(() => {
            this.setupGuineaPigSizes();
        }, 200);
    }
    
    setupResizeHandling() {
        // Listen for ButtonBar dimension updates
        if (window.ButtonBar) {
            window.ButtonBar.addObserver(() => {
                setTimeout(() => {
                    this.setupGuineaPigSizes();
                }, 100);
            });
        }
        
        // Also handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupGuineaPigSizes();
            }, 100);
        });
    }
    
    initializeAudio() {
        // Create audio element for guinea pig eating sounds
        this.guineaPigAudio = new Audio(CONFIG.AUDIO.GUINEA_PIG_EATING_SOUND);
        this.guineaPigAudio.volume = CONFIG.AUDIO.GUINEA_PIG_SOUND_VOLUME;
        this.guineaPigAudio.preload = 'auto';
        
        // Handle audio loading errors (fallback to synthesized sounds)
        this.guineaPigAudio.addEventListener('error', () => {
            console.warn('🐹 Guinea pig audio file failed to load, using fallback sounds');
            this.guineaPigAudio = null;
        });
    }
    
    setupGuineaPigSizes() {
        if (!this.gameArea) {
            console.warn('🐹 Game area not found for guinea pig sizing');
            return;
        }
        
        // Force a reflow to ensure we get accurate dimensions
        this.gameArea.offsetHeight;
        
        // Get actual game area dimensions (set by ButtonBar)
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaHeight = gameAreaRect.height;
        
        if (gameAreaHeight <= 0) {
            console.warn('🐹 Game area height is 0, retrying guinea pig sizing...');
            setTimeout(() => {
                this.setupGuineaPigSizes();
            }, 100);
            return;
        }
        
        // Use game area height for sizing - much simpler system
        const gp3Size = gameAreaHeight * (CONFIG.GUINEA_PIG_SIZES.GP3 / 100);
        const gp2Size = gameAreaHeight * (CONFIG.GUINEA_PIG_SIZES.GP2 / 100);
        const gp1Size = gameAreaHeight * (CONFIG.GUINEA_PIG_SIZES.GP1 / 100);
        
        if (this.guineaPig3) {
            this.guineaPig3.style.width = `${gp3Size}px`;
            this.guineaPig3.style.height = `${gp3Size}px`;
            // Show guinea pig 3 after sizing (it should be visible by default)
            this.guineaPig3.classList.add('sized');
        }
        
        if (this.guineaPig2) {
            this.guineaPig2.style.width = `${gp2Size}px`;
            this.guineaPig2.style.height = `${gp2Size}px`;
            // Add sized class but keep hidden class for now
            this.guineaPig2.classList.add('sized');
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.style.width = `${gp1Size}px`;
            this.guineaPig1.style.height = `${gp1Size}px`;
            // Add sized class but keep hidden class for now
            this.guineaPig1.classList.add('sized');
        }
        
        console.log('🐹 Guinea pig sizes updated:', {
            gp3: Math.round(gp3Size),
            gp2: Math.round(gp2Size), 
            gp1: Math.round(gp1Size),
            gameAreaHeight: Math.round(gameAreaHeight)
        });
    }
    
    hideGuineaPig3() {
        console.log('🐹 hideGuineaPig3 called');
        if (this.guineaPig3) {
            this.guineaPig3.classList.add('hidden');
            this.guineaPig3.classList.remove('bounce');
        }
    }
    
    showGuineaPig3() {
        console.log('🐹 showGuineaPig3 called');
        if (this.guineaPig3) {
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.classList.add('bounce');
        }
    }
    
    async fadeOutGuineaPig3() {
        console.log('🐹 fadeOutGuineaPig3 called');
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                resolve();
                return;
            }
            
            this.guineaPig3.style.transition = 'opacity 0.5s ease-out';
            this.guineaPig3.style.opacity = '0';
            this.guineaPig3.classList.remove('bounce');
            
            setTimeout(() => {
                this.guineaPig3.classList.add('hidden');
                resolve();
            }, 500);
        });
    }
    
    async fadeInGuineaPig3() {
        console.log('🐹 fadeInGuineaPig3 called');
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                resolve();
                return;
            }
            
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.style.transition = 'opacity 0.5s ease-in';
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.classList.add('bounce');
            
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }
    
    async moveGuineaPig2(raisinsToEat) {
        console.log('🐹 === STARTING GUINEA PIG 2 MOVEMENT ===');
        console.log('🐹 Raisins to eat:', raisinsToEat);
        
        return new Promise((resolve) => {
            if (!this.guineaPig2 || !this.gameArea) {
                console.error('🐹 ❌ Guinea pig 2 or game area not found!');
                resolve();
                return;
            }
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const gpWidth = this.guineaPig2.offsetWidth;
            const startX = -gpWidth;
            const endX = gameAreaRect.width + gpWidth;
            
            console.log('🐹 GP2 movement setup:', {
                gameAreaWidth: gameAreaRect.width,
                gpWidth,
                startX,
                endX,
                animationDuration: CONFIG.GUINEA_PIG_ANIMATION_DURATION
            });
            
            // Show guinea pig 2 and set initial position
            this.guineaPig2.classList.remove('hidden');
            this.guineaPig2.classList.add('moving');
            this.guineaPig2.style.left = `${startX}px`;
            
            // Start moving after brief delay
            setTimeout(() => {
                this.guineaPig2.style.left = `${endX}px`;
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig2, raisinsToEat, 'left-to-right');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                this.guineaPig2.classList.add('hidden');
                this.guineaPig2.classList.remove('moving');
                this.guineaPig2.style.left = '-25%'; // Reset position
                
                console.log('🐹 === GUINEA PIG 2 MOVEMENT COMPLETE ===');
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    async moveGuineaPig1(raisinsToEat) {
        console.log('🐹 === STARTING GUINEA PIG 1 MOVEMENT ===');
        console.log('🐹 Raisins to eat:', raisinsToEat);
        
        return new Promise((resolve) => {
            if (!this.guineaPig1 || !this.gameArea) {
                console.error('🐹 ❌ Guinea pig 1 or game area not found!');
                resolve();
                return;
            }
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const gpWidth = this.guineaPig1.offsetWidth;
            const startRight = -gpWidth;
            const endRight = gameAreaRect.width + gpWidth;
            
            console.log('🐹 GP1 movement setup:', {
                gameAreaWidth: gameAreaRect.width,
                gpWidth,
                startRight,
                endRight,
                animationDuration: CONFIG.GUINEA_PIG_ANIMATION_DURATION
            });
            
            // Show guinea pig 1 and position it on the right side
            this.guineaPig1.classList.remove('hidden');
            this.guineaPig1.classList.add('moving');
            this.guineaPig1.style.left = 'auto';
            this.guineaPig1.style.right = `${startRight}px`;
            
            // Start moving from right to left after brief delay
            setTimeout(() => {
                this.guineaPig1.style.right = `${endRight}px`;
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig1, raisinsToEat, 'right-to-left');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                this.guineaPig1.classList.add('hidden');
                this.guineaPig1.classList.remove('moving');
                this.guineaPig1.style.right = '-25%'; // Reset position
                this.guineaPig1.style.left = 'auto';
                
                console.log('🐹 === GUINEA PIG 1 MOVEMENT COMPLETE ===');
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    eatRaisinsOnPath(guineaPig, raisinsToEat, direction) {
        if (!guineaPig || !this.gameArea) return;
        
        console.log(`🍽️ Starting predictive raisin eating for ${direction}:`, raisinsToEat);
        
        const animationDuration = CONFIG.GUINEA_PIG_ANIMATION_DURATION;
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        const gpWidth = guineaPig.offsetWidth;
        
        // Calculate total travel distance and speed
        const totalDistance = gameAreaWidth + (2 * gpWidth); // From off-screen to off-screen
        const pixelsPerMs = totalDistance / animationDuration; // pixels per millisecond
        
        console.log(`🍽️ ${direction} - Total distance: ${Math.round(totalDistance)}px, Speed: ${pixelsPerMs.toFixed(2)}px/ms`);
        
        // Get starting time reference
        const animationStartTime = performance.now();
        
        // Calculate when each raisin should be eaten based on position
        const raisinElements = this.positionRenderer.getRaisinElements();
        const eatingSchedule = [];
        
        raisinsToEat.forEach(raisinIndex => {
            const raisinElement = raisinElements[raisinIndex];
            if (raisinElement) {
                const raisinRect = raisinElement.getBoundingClientRect();
                const gameAreaTop = gameAreaRect.top;
                const gameAreaLeft = gameAreaRect.left;
                
                // Convert to game area coordinates
                const raisinGameX = raisinRect.left - gameAreaLeft;
                const raisinGameY = raisinRect.top - gameAreaTop;
                const raisinCenterX = raisinGameX + (raisinRect.width / 2);
                const raisinCenterY = raisinGameY + (raisinRect.height / 2);
                const raisinGameAreaY = raisinCenterY / gameAreaHeight; // 0.0 = top, 1.0 = bottom
                
                console.log(`🍇 Raisin ${raisinIndex} at game coordinates (${Math.round(raisinCenterX)}, ${Math.round(raisinCenterY)}) = (${Math.round((raisinCenterX/gameAreaWidth)*100)}%, ${Math.round(raisinGameAreaY*100)}%)`);
                
                // Check if this raisin is in the correct path for this guinea pig
                let shouldEat = false;
                let crossingTime = 0;
                
                if (direction === 'left-to-right') {
                    // GP2 eats raisins in TOP HALF (0% to 50% from top)
                    if (raisinGameAreaY <= 0.5) {
                        // Calculate when GP2's center will reach this raisin's center
                        // GP2 starts at x = -gpWidth, needs to travel to raisinCenterX
                        const distanceToRaisin = gpWidth + raisinCenterX;
                        crossingTime = distanceToRaisin / pixelsPerMs;
                        shouldEat = true;
                        console.log(`🍽️ ${direction} - Raisin ${raisinIndex} in TOP half (${Math.round(raisinGameAreaY*100)}% from top) - WILL EAT`);
                    } else {
                        console.log(`🍽️ ${direction} - Raisin ${raisinIndex} in BOTTOM half (${Math.round(raisinGameAreaY*100)}% from top) - SKIP`);
                    }
                } else {
                    // GP1 eats raisins in BOTTOM HALF (50% to 100% from top)
                    if (raisinGameAreaY > 0.5) {
                        // Calculate when GP1's center will reach this raisin's center
                        // GP1 starts at x = gameAreaWidth + gpWidth, needs to travel to raisinCenterX
                        const distanceToRaisin = (gameAreaWidth + gpWidth) - raisinCenterX;
                        crossingTime = distanceToRaisin / pixelsPerMs;
                        shouldEat = true;
                        console.log(`🍽️ ${direction} - Raisin ${raisinIndex} in BOTTOM half (${Math.round(raisinGameAreaY*100)}% from top) - WILL EAT`);
                    } else {
                        console.log(`🍽️ ${direction} - Raisin ${raisinIndex} in TOP half (${Math.round(raisinGameAreaY*100)}% from top) - SKIP`);
                    }
                }
                
                if (shouldEat) {
                    eatingSchedule.push({
                        raisinIndex,
                        crossingTime: Math.round(crossingTime),
                        raisinCenterX: Math.round(raisinCenterX),
                        raisinCenterY: Math.round(raisinCenterY)
                    });
                    
                    console.log(`🍽️ ${direction} - Raisin ${raisinIndex} at (${Math.round(raisinCenterX)}, ${Math.round(raisinCenterY)}) will be eaten at ${Math.round(crossingTime)}ms`);
                }
            }
        });
        
        // Sort by crossing time
        eatingSchedule.sort((a, b) => a.crossingTime - b.crossingTime);
        
        // Schedule raisin eating based on calculated times
        eatingSchedule.forEach(schedule => {
            setTimeout(() => {
                console.log(`🍽️ ${direction} - Eating raisin ${schedule.raisinIndex} at ${Math.round(performance.now() - animationStartTime)}ms (predicted: ${schedule.crossingTime}ms)`);
                this.positionRenderer.eatRaisin(schedule.raisinIndex);
            }, schedule.crossingTime);
        });
        
        // Backup cleanup after animation completes
        setTimeout(() => {
            raisinsToEat.forEach(raisinIndex => {
                const raisinElement = raisinElements[raisinIndex];
                if (raisinElement && !raisinElement.classList.contains('eaten')) {
                    console.log(`🔧 Backup cleanup: eating missed raisin ${raisinIndex} (${direction})`);
                    this.positionRenderer.eatRaisin(raisinIndex);
                }
            });
        }, animationDuration + 200);
        
        console.log(`🍽️ ${direction} - Scheduled ${eatingSchedule.length} raisins for eating`);
    }
    
    startGuineaPigSounds() {
        if (!window.AudioSystem || !window.AudioSystem.isTabVisible) return;
        
        this.stopGuineaPigSounds(); // Clear any existing interval
        
        // Try to use MP3 audio first
        if (this.guineaPigAudio) {
            console.log('🐹 Playing MP3 guinea pig eating sounds');
            this.guineaPigAudio.loop = true;
            this.guineaPigAudio.currentTime = 0;
            
            const playPromise = this.guineaPigAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('🐹 MP3 audio playback failed, using fallback sounds:', error);
                    this.playFallbackSounds();
                });
            }
        } else {
            // Fallback to synthesized sounds
            this.playFallbackSounds();
        }
    }
    
    playFallbackSounds() {
        console.log('🐹 Using fallback synthesized guinea pig sounds');
        
        // Play first sound immediately using AudioSystem
        this.playGuineaPigSound();
        
        // Continue playing sounds at intervals (faster for eating effect)
        this.guineaPigSoundInterval = setInterval(() => {
            this.playGuineaPigSound();
        }, 200); // Play every 200ms
    }
    
    playGuineaPigSound() {
        if (window.AudioSystem) {
            // Create a faster squeaky guinea pig sound using AudioSystem's playTone
            window.AudioSystem.playTone(800, 0.083, 'sawtooth', 0.3);
        }
    }
    
    stopGuineaPigSounds() {
        // Stop MP3 audio
        if (this.guineaPigAudio) {
            this.guineaPigAudio.pause();
            this.guineaPigAudio.currentTime = 0;
        }
        
        // Stop synthesized sound interval
        if (this.guineaPigSoundInterval) {
            clearInterval(this.guineaPigSoundInterval);
            this.guineaPigSoundInterval = null;
        }
    }
    
    reset() {
        console.log('🐹 Resetting guinea pig animation renderer');
        
        this.stopGuineaPigSounds();
        
        if (this.guineaPig2) {
            this.guineaPig2.classList.add('hidden');
            this.guineaPig2.style.left = '-25%';
            this.guineaPig2.style.right = 'auto';
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.classList.add('hidden');
            this.guineaPig1.style.right = '-25%';
            this.guineaPig1.style.left = 'auto';
        }
        
        // Reset guinea pig 3 to initial state
        if (this.guineaPig3) {
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.style.transition = '';
            this.showGuineaPig3();
        }
        
        // Clear any remaining nom effects
        const nomEffects = this.gameArea.querySelectorAll('.nom-effect');
        nomEffects.forEach(effect => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        });
    }
    
    destroy() {
        this.stopGuineaPigSounds();
        
        // Clean up resize observer
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.setupGuineaPigSizes);
        }
        
        window.removeEventListener('resize', this.setupGuineaPigSizes);
        
        // Clean up audio element
        if (this.guineaPigAudio) {
            this.guineaPigAudio.removeEventListener('error', () => {});
            this.guineaPigAudio = null;
        }
        
        this.reset();
    }
}
