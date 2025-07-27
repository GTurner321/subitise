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
    
    // Level system
    LEVELS: {
        1: [2, 3, 4, 5],
        2: [6, 7, 8, 9, 10],
        3: [11, 12, 13, 14, 15],
        4: [16, 17, 18, 19],
        5: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    },
    
    // Timing
    COMPLETION_TIME_THRESHOLD: 15000, // 15 seconds in milliseconds
    ANSWER_CONFIRMATION_DELAY: 2000, // 2 seconds to confirm answer
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    
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
    TOP_BAR_POSITION: 34, // 34% down from top
    BOTTOM_BAR_POSITION: 60, // 60% down from top
    BAR_LEFT_MARGIN: 6, // 6% from left
    BAR_RIGHT_MARGIN: 8, // 8% from right (so bar goes to 92%)
    BAR_THICKNESS: 5, // 1/20th of container height
    
    // Audio
    AUDIO_ENABLED: true,
    
    // Button numbers for display (all possible numbers)
    BUTTON_NUMBERS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
};
