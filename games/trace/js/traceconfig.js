// Number tracing game configuration settings
const CONFIG = {
    // Game mechanics
    NUMBERS_TO_COMPLETE: 10, // Complete numbers 0-9
    RAINBOW_PIECES: 10, // One piece per number
    
    // Tracing mechanics
    SLIDER_SIZE: 40, // Circle diameter in pixels
    PATH_TOLERANCE: 35, // How far finger can stray from path (pixels)
    FILL_COLOR: '#90EE90', // Light green fill color
    PATH_COLOR: '#E0E0E0', // Light gray for unfilled path
    SLIDER_COLOR: '#FF6B6B', // Red slider circle
    ARROW_COLOR: '#4ECDC4', // Teal direction arrow
    PATH_WIDTH: 12, // Width of the tracing path
    ARROW_OFFSET: 50, // Distance arrow appears ahead of slider
    ARROW_SIZE: 20, // Size of direction arrow
    
    // SVG dimensions and scaling
    SVG_WIDTH: 400,
    SVG_HEIGHT: 400,
    NUMBER_SCALE: 0.8, // How much of SVG the number should fill
    
    // Animation and timing
    COMPLETION_DELAY: 2000, // Delay before next number (ms)
    FILL_ANIMATION_SPEED: 0.3, // Speed of green fill effect
    SLIDER_TRANSITION_SPEED: '0.1s', // CSS transition speed for slider
    
    // Audio settings
    AUDIO_ENABLED: true,
    CELEBRATION_SOUNDS: true,
    
    // Number word pronunciations (for audio)
    NUMBER_WORDS: {
        0: 'zero',
        1: 'one', 
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine'
    },
    
    // Multi-stroke number definitions
    // Each number can have multiple strokes that must be completed in order
    STROKE_DEFINITIONS: {
        0: {
            strokes: [
                {
                    id: 'main_oval',
                    startPoint: { x: 200, y: 80 }, // Top center
                    path: 'M 200 80 C 280 80 320 140 320 200 C 320 260 280 320 200 320 C 120 320 80 260 80 200 C 80 140 120 80 200 80 Z',
                    description: 'Draw the oval shape starting from the top'
                }
            ]
        },
        
        1: {
            strokes: [
                {
                    id: 'main_line',
                    startPoint: { x: 180, y: 80 }, // Top left, then down to bottom
                    path: 'M 180 80 L 200 60 L 200 320',
                    description: 'Draw from top left, up slightly, then straight down'
                }
            ]
        },
        
        2: {
            strokes: [
                {
                    id: 'curve_and_line',
                    startPoint: { x: 100, y: 140 }, // Start at left side of top curve
                    path: 'M 100 140 C 100 100 140 80 200 80 C 260 80 300 100 300 140 C 300 180 260 200 220 220 L 120 300 L 300 300',
                    description: 'Draw the curved top, then diagonal line, then bottom line'
                }
            ]
        },
        
        3: {
            strokes: [
                {
                    id: 'top_curve',
                    startPoint: { x: 120, y: 120 }, // Top curve
                    path: 'M 120 120 C 120 90 150 80 200 80 C 250 80 280 90 280 120 C 280 150 250 160 220 160',
                    description: 'Draw the top curved section'
                },
                {
                    id: 'bottom_curve',
                    startPoint: { x: 220, y: 160 }, // Continue from middle
                    path: 'M 220 160 C 250 160 280 170 280 200 C 280 230 250 240 200 240 C 150 240 120 230 120 200',
                    description: 'Draw the bottom curved section'
                }
            ]
        },
        
        4: {
            strokes: [
                {
                    id: 'left_vertical',
                    startPoint: { x: 160, y: 80 }, // Left vertical line
                    path: 'M 160 80 L 160 200',
                    description: 'Draw the left vertical line downward'
                },
                {
                    id: 'horizontal',
                    startPoint: { x: 160, y: 200 }, // Horizontal line
                    path: 'M 160 200 L 280 200',
                    description: 'Draw the horizontal line to the right'
                },
                {
                    id: 'right_vertical',
                    startPoint: { x: 240, y: 80 }, // Right vertical line
                    path: 'M 240 80 L 240 320',
                    description: 'Draw the right vertical line all the way down'
                }
            ]
        },
        
        5: {
            strokes: [
                {
                    id: 'top_horizontal',
                    startPoint: { x: 120, y: 80 }, // Top line left to right
                    path: 'M 120 80 L 280 80',
                    description: 'Draw the top horizontal line'
                },
                {
                    id: 'left_vertical',
                    startPoint: { x: 120, y: 80 }, // Down and curve
                    path: 'M 120 80 L 120 180 C 120 180 140 180 180 180 C 220 180 280 180 280 220 C 280 260 240 300 180 300 C 140 300 120 280 120 260',
                    description: 'Draw down then curve around for the bottom'
                }
            ]
        },
        
        6: {
            strokes: [
                {
                    id: 'main_curve',
                    startPoint: { x: 280, y: 140 }, // Start from right side
                    path: 'M 280 140 C 280 100 240 80 200 80 C 160 80 120 100 120 140 L 120 260 C 120 300 160 320 200 320 C 240 320 280 300 280 260 C 280 220 240 200 200 200 C 160 200 120 220 120 240',
                    description: 'Draw the complete curved shape of 6'
                }
            ]
        },
        
        7: {
            strokes: [
                {
                    id: 'top_and_diagonal',
                    startPoint: { x: 120, y: 80 }, // Top line then diagonal
                    path: 'M 120 80 L 280 80 L 160 320',
                    description: 'Draw the top line then diagonal down'
                }
            ]
        },
        
        8: {
            strokes: [
                {
                    id: 'figure_eight',
                    startPoint: { x: 200, y: 80 }, // Start at top center
                    path: 'M 200 80 C 160 80 120 100 120 140 C 120 180 160 200 200 200 C 240 200 280 180 280 140 C 280 100 240 80 200 80 M 200 200 C 160 200 120 220 120 260 C 120 300 160 320 200 320 C 240 320 280 300 280 260 C 280 220 240 200 200 200',
                    description: 'Draw the figure-eight shape'
                }
            ]
        },
        
        9: {
            strokes: [
                {
                    id: 'main_curve',
                    startPoint: { x: 120, y: 160 }, // Start from left side
                    path: 'M 120 160 C 120 120 160 100 200 100 C 240 100 280 120 280 160 L 280 260 C 280 300 240 320 200 320 C 160 320 120 300 120 260 C 120 220 160 200 200 200 C 240 200 280 220 280 240',
                    description: 'Draw the complete curved shape of 9'
                }
            ]
        }
    },
    
    // Rainbow colors (reusing from your existing config)
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#80ff00', // Yellow-Green
        '#00ff00', // Green
        '#00ff80', // Green-Cyan
        '#00ffff', // Cyan
        '#0080ff', // Blue-Cyan
        '#0000ff', // Blue
        '#8000ff'  // Purple
    ],
    
    // Game progression settings
    NUMBERS_SEQUENCE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Order to present numbers
    ALLOW_SKIP: false, // Whether children can skip difficult numbers
    REPEAT_ON_MISTAKE: true, // Whether to restart stroke on major mistakes
    
    // Debug settings
    DEBUG_MODE: false, // Shows path guides and hit areas
    SHOW_START_POINTS: true, // Shows green dots at stroke start points
    
    // Touch/Mouse settings
    TOUCH_SMOOTHING: true, // Smooth out touch input
    MOUSE_SIMULATION: true // Allow mouse to simulate touch for testing
};
