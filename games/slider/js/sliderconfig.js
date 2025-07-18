const CONFIG = {
    // Game progression
    MAX_QUESTIONS: 10,
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#00ff00', // Green
        '#0000ff', // Blue
        '#4b0082', // Indigo
        '#9400d3', // Violet
        '#ff1493', // Deep Pink
        '#00ced1', // Dark Turquoise
        '#ffd700'  // Gold
    ],
    
    // Bead properties
    BEADS_PER_BAR: 10,
    TOTAL_BEADS: 20,
    BEAD_COLORS: {
        BLUE: '#4285f4',
        RED: '#ea4335'
    },
    
    // Physics and interaction
    SNAP_DISTANCE: 5, // Pixels within which beads snap together
    DRAG_THRESHOLD: 3, // Minimum pixels to start dragging
    SNAP_SPEED: 200, // Speed of snap animation in pixels per second
    MAGNETIC_RANGE: 15, // Range for magnetic attraction
    
    // Layout (percentages of container)
    TOP_BAR_POSITION: 30, // 30% down from top
    BOTTOM_BAR_POSITION: 70, // 70% down from top
    BAR_LEFT_MARGIN: 8, // 8% from left
    BAR_RIGHT_MARGIN: 8, // 8% from right (so bar goes to 92%)
    BAR_THICKNESS: 5, // 1/20th of container height
    
    // Audio
    AUDIO_ENABLED: true,
    
    // Timing
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    
    // Button numbers (will be shuffled each game)
    BUTTON_NUMBERS: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
};
