const CONFIG = {
    // Game progression
    RAINBOW_PIECES: 10,
    TOTAL_QUESTIONS: 10,
    
    // Timing configurations
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    GUINEA_PIG_3_INITIAL_DISPLAY: 4000, // 4 seconds initial display
    INITIAL_INSTRUCTION_DELAY: 1000, // 1 second after initial display
    RAISIN_STAGGER_START: 1000, // 1 second after game loads
    RAISIN_STAGGER_WINDOW: 3000, // 3 second window for raisins to appear
    RAISIN_FADE_DURATION: 500, // 0.5 seconds fade in
    GUINEA_PIG_ANIMATION_DURATION: 2000, // 2 seconds for each guinea pig to cross (50% faster)
    GUINEA_PIG_PAUSE_DURATION: 500, // Pause between guinea pigs
    
    // Guinea pig sizes (relative to screen width)
    GUINEA_PIG_3_SIZE: 0.1, // 10% of screen width
    GUINEA_PIG_2_SIZE: 0.22, // 22% of screen width (will be made 20% larger in renderer)
    GUINEA_PIG_1_SIZE: 0.22, // 22% of screen width (will be made 20% larger in renderer)
    
    // Raisin settings
    RAISIN_SIZE: 0.08, // 8% of screen width
    RAISIN_MIN_DISTANCE: 0.12, // Minimum distance between raisins
    TOTAL_RAISINS: 10,
    
    // Game area exclusions - area to avoid placing raisins
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,        // Start from left edge
        y: 0,        // Start from top edge  
        width: 0.25, // 25% of game area width
        height: 0.25 // 25% of game area height
    },
    
    // Hidden difficulty levels that adapt based on player performance
    DIFFICULTY_LEVELS: {
        LEVEL_1: {
            possibleRaisinsToEat: [1, 2], // Easier numbers
            name: 'Level 1'
        },
        LEVEL_2: {
            possibleRaisinsToEat: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Full range
            name: 'Level 2'
        },
        LEVEL_3: {
            possibleRaisinsToEat: [1, 2, 5, 9], // Specific challenging numbers
            name: 'Level 3'
        }
    }
};
