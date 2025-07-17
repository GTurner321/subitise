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
    GUINEA_PIG_ANIMATION_DURATION: 3000, // 3 seconds for each guinea pig to cross
    GUINEA_PIG_PAUSE_DURATION: 500, // Pause between guinea pigs
    
    // Guinea pig sizes (relative to screen)
    GUINEA_PIG_3_SIZE: 0.1, // 1/10th of screen width
    GUINEA_PIG_2_SIZE: 0.2, // 1/5th of screen width
    GUINEA_PIG_1_SIZE: 0.2, // 1/5th of screen width
    
    // Raisin settings
    RAISIN_SIZE: 0.05, // 1/20th of screen width (or 1/15th of height if height > width)
    RAISIN_MIN_DISTANCE: 0.08, // Minimum distance between raisins (relative to screen)
    TOTAL_RAISINS: 10,
    
    // Audio
    AUDIO_ENABLED: true,
    
    // Game area exclusions
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,
        y: 0,
        width: 0.15, // Slightly larger than guinea pig 3
        height: 0.15
    }
};
