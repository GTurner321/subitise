8: {
            strokes: [
                {
                    id: 'figure_eight_traditional',
                    startPoint: { x: 250, y: 130 }, // Start at right of top circle
                    path: 'M 250 130 C 250 110 230 100 200 100 C 170 100 150 110 150 130 C 150 150 170 160 200 160 C 230 160 250 170 250 190 C 250 210 230 220 200 220 C 170 220 150 210 150 190 C 150 210 170 220 200 220 C 230 220 250 240 250 270 C 250 290 230 300 200 300 C 170 300 150 290 150 270 C 150 240 170 220 200 220 C 230 220 250 210 250 190 C 250 170 230 160 200 160 C 170 160 150 150 150 130 C 150 110 170 100 200 100 C 230 100 250 110 250 130',
                    description: 'Traditional figure-8 that returns to start'
                }
            ]
        },// Number tracing game configuration settings
const CONFIG = {
    // Game mechanics
    NUMBERS_TO_COMPLETE: 10, // Complete numbers 0-9
    RAINBOW_PIECES: 10, // One piece per number
    
    // Tracing mechanics
    SLIDER_SIZE: 40, // Circle diameter in pixels
    PATH_TOLERANCE: 15, // Much stricter tolerance - how far finger can stray from path (pixels)
    FILL_COLOR: '#90EE90', // Light green fill color
    PATH_COLOR: '#E0E0E0', // Light gray for unfilled path (not used now - outline only)
    OUTLINE_COLOR: '#333333', // Dark outline color
    SLIDER_COLOR: '#FF6B6B', // Red slider circle
    ARROW_COLOR: '#4ECDC4', // Teal direction arrow
    PATH_WIDTH: 8, // Width of the tracing path
    OUTLINE_WIDTH: 3, // Width of the solid outline
    ARROW_OFFSET: 50, // Distance arrow appears ahead of slider
    ARROW_SIZE: 20, // Size of direction arrow
    
    // SVG dimensions and scaling
    SVG_WIDTH: 400,
    SVG_HEIGHT: 400,
    // Number sizing - rectangle is half height of container, width is 60% of height
    NUMBER_RECT_HEIGHT: 200, // Half of SVG_HEIGHT
    NUMBER_RECT_WIDTH: 120,  // 60% of NUMBER_RECT_HEIGHT
    NUMBER_CENTER_X: 200,    // Center of SVG
    NUMBER_CENTER_Y: 200,    // Center of SVG
    
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
    // Each number fits in a rectangle: width=120px, height=200px, centered at (200,200)
    // Rectangle bounds: left=140, right=260, top=100, bottom=300
    STROKE_DEFINITIONS: {
        0: {
            strokes: [
                {
                    id: 'oval',
                    startPoint: { x: 200, y: 100 }, // Top center
                    path: 'M 200 100 C 250 100 260 125 260 200 C 260 275 250 300 200 300 C 150 300 140 275 140 200 C 140 125 150 100 200 100 Z',
                    description: 'Draw the oval shape starting from the top'
                }
            ]
        },
        
        1: {
            strokes: [
                {
                    id: 'vertical_line',
                    startPoint: { x: 200, y: 100 }, // Top center
                    path: 'M 200 100 L 200 300',
                    description: 'Draw straight down from top to bottom'
                }
            ]
        },
        
        2: {
            strokes: [
                {
                    id: 'complete_two',
                    startPoint: { x: 140, y: 130 }, // Start at left side of top curve
                    path: 'M 140 130 C 140 110 165 100 200 100 C 235 100 260 110 260 130 C 260 150 235 160 215 170 L 140 280 L 260 280',
                    description: 'Draw the complete 2 in one movement'
                }
            ]
        },
        
        3: {
            strokes: [
                {
                    id: 'complete_three',
                    startPoint: { x: 140, y: 100 }, // Top left
                    path: 'M 140 100 C 140 100 165 100 200 100 C 235 100 260 105 260 130 C 260 155 235 160 215 180 C 235 200 260 205 260 230 C 260 255 235 260 200 260 C 165 260 140 255 140 230 M 215 180 C 235 200 260 270 260 285 C 260 295 235 300 200 300 C 165 300 140 295 140 285',
                    description: 'Draw the complete 3 extending to full height'
                }
            ]
        },
        
        4: {
            strokes: [
                {
                    id: 'left_and_horizontal',
                    startPoint: { x: 140, y: 100 }, // Top left, slanted inward
                    path: 'M 140 100 L 190 250 L 260 250',
                    description: 'Draw slanted inward down then across to full width'
                },
                {
                    id: 'right_vertical',
                    startPoint: { x: 210, y: 100 }, // Right vertical line
                    path: 'M 210 100 L 210 300',
                    description: 'Draw the right vertical line to full height'
                }
            ]
        },
        
        5: {
            strokes: [
                {
                    id: 'top_line',
                    startPoint: { x: 140, y: 100 }, // Top line only
                    path: 'M 140 100 L 260 100',
                    description: 'Draw the top horizontal line to full width'
                },
                {
                    id: 'vertical_and_curve',
                    startPoint: { x: 140, y: 100 }, // Start again at top left
                    path: 'M 140 100 L 140 200 C 140 200 165 200 200 200 C 235 200 260 210 260 240 C 260 270 235 280 200 280 C 165 280 140 270 140 240',
                    description: 'Draw down then curve for the bottom'
                }
            ]
        },
        
        6: {
            strokes: [
                {
                    id: 'complete_six',
                    startPoint: { x: 250, y: 140 }, // Start from right side, avoid bottom overlap
                    path: 'M 250 140 C 250 115 225 100 200 100 C 175 100 150 115 150 140 L 150 260 C 150 285 175 300 200 300 C 225 300 250 285 250 260 C 250 235 225 220 200 220 C 175 220 150 235 150 250',
                    description: 'Draw the complete 6 avoiding the overlap issue'
                }
            ]
        },
        
        7: {
            strokes: [
                {
                    id: 'complete_seven',
                    startPoint: { x: 140, y: 100 }, // Top left
                    path: 'M 140 100 L 260 100 L 180 300',
                    description: 'Draw across full width then diagonal down to full height'
                }
            ]
        },
        
        8: {
            strokes: [
                {
                    id: 'figure_eight',
                    startPoint: { x: 250, y: 130 }, // Start at right of top circle
                    path: 'M 250 130 C 250 110 225 100 200 100 C 175 100 150 110 150 130 C 150 150 175 160 200 160 C 225 160 250 170 250 190 C 250 210 225 220 200 220 C 175 220 150 210 150 190 C 150 170 175 160 200 160 C 225 160 250 280 250 290 C 250 295 225 300 200 300 C 175 300 150 295 150 290 C 150 280 175 270 200 270 C 225 270 250 280 250 290 C 250 270 225 260 200 260 C 175 260 150 270 150 290 C 150 270 175 160 200 160 C 225 160 250 150 250 130',
                    description: 'Draw figure-8 to full dimensions'
                }
            ]
        },
        
        9: {
            strokes: [
                {
                    id: 'complete_nine',
                    startPoint: { x: 250, y: 140 }, // Start at right of top circle
                    path: 'M 250 140 C 250 115 225 100 200 100 C 175 100 150 115 150 140 C 150 165 175 180 200 180 C 225 180 250 165 250 140 L 250 300',
                    description: 'Draw circle at top full width then straight stem to full height'
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
