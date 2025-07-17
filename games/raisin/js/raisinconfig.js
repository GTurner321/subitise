const CONFIG = {
    // Game progression
    RAINBOW_PIECES: 10,
    TOTAL_QUESTIONS: 10,
    
    // Rainbow colors (same as other games)
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange
        '#ffff00', // Yellow
        '#80ff00', // Yellow-green
        '#00ff00', // Green
        '#00ff80', // Green-cyan
        '#00ffff', // Cyan
        '#0080ff', // Cyan-blue
        '#0000ff', // Blue
        '#8000ff'  // Blue-purple
    ],
    
    // Timing
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    GUINEA_PIG_3_INITIAL_DISPLAY: 4000, // 4 seconds initial display
    INITIAL_INSTRUCTION_DELAY: 1000, // 1 second after initial display
    RAISIN_STAGGER_START: 1000, // 1 second after game loads
    RAISIN_STAGGER_WINDOW: 3000, // 3 second window for raisins to appear
    RAISIN_FADE_DURATION: 500, // 0.5 seconds fade in
    GUINEA_PIG_ANIMATION_DURATION: 3000, // 3 seconds for each guinea pig to cross
    GUINEA_PIG_PAUSE_DURATION: 500, // Pause between guinea pigs
    
    // Guinea pig sizes (relative to screen)
    GUINEA_PIG_3_SIZE: 0.1, // 1/10th of screen width
    GUINEA_PIG_2_SIZE: 0.25, // 1/4th of screen width (25% larger)
    GUINEA_PIG_1_SIZE: 0.25, // 1/4th of screen width (25% larger)
    
    // Raisin settings
    RAISIN_SIZE: 0.1, // 1/10th of screen width (twice as large)
    RAISIN_MIN_DISTANCE: 0.12, // Increased minimum distance between raisins
    TOTAL_RAISINS: 10,
    
    // Audio
    AUDIO_ENABLED: true,
    NOM_NOM_PITCH: 1.8, // Higher pitch for nom-nom sounds
    
    // Game area exclusions - expanded for top right
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,
        y: 0,
        width: 0.25, // Expanded width
        height: 0.25  // Expanded height
    },
    
    // Difficulty levels (hidden from user)
    DIFFICULTY_LEVELS: {
        LEVEL_1: {
            possibleRaisinsToEat: [1, 2],
            name: 'Level 1'
        },
        LEVEL_2: {
            possibleRaisinsToEat: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            name: 'Level 2'
        },
        LEVEL_3: {
            possibleRaisinsToEat: [1, 2, 5, 9],
            name: 'Level 3'
        }
    }
};
