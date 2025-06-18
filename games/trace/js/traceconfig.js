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
                    startPoint: { x: 145, y: 130 }, // Start at left side of top curve
                    path: 'M 145 130 C 145 110 165 100 200 100 C 235 100 255 110 255 130 C 255 150 235 160 215 170 L 145 280 L 255 280',
                    description: 'Draw the complete 2 in one movement'
                }
            ]
        },
        
        3: {
            strokes: [
                {
                    id: 'complete_three',
                    startPoint: { x: 145, y: 120 }, // Top left
                    path: 'M 145 120 C 145 105 165 100 200 100 C 235 100 255 105 255 120 C 255 135 235 140 215 150 C 235 160 255 165 255 180 C 255 195 235 200 200 200 C 165 200 145 195 145 180',
                    description: 'Draw the complete 3 in one movement'
                }
            ]
        },
        
        4: {
            strokes: [
                {
                    id: 'left_and_horizontal',
                    startPoint: { x: 170, y: 100 }, // Top left, angled inward
                    path: 'M 170 100 L 170 220 L 250 220',
                    description: 'Draw down then across'
                },
                {
                    id: 'right_vertical',
                    startPoint: { x: 230, y: 100 }, // Right vertical line
                    path: 'M 230 100 L 230 300',
                    description: 'Draw the right vertical line'
                }
            ]
        },
        
        5: {
            strokes: [
                {
                    id: 'complete_five',
                    startPoint: { x: 145, y: 100 }, // Top left
                    path: 'M 145 100 L 245 100 L 245 120 L 155 120 L 155 180 C 155 180 165 180 200 180 C 235 180 255 185 255 210 C 255 235 235 240 200 240 C 165 240 145 235 145 210',
                    description: 'Draw the complete 5 in one movement'
                }
            ]
        },
        
        6: {
            strokes: [
                {
                    id: 'complete_six',
                    startPoint: { x: 240, y: 130 }, // Start from right side
                    path: 'M 240 130 C 240 110 220 100 200 100 C 180 100 160 110 160 130 L 160 270 C 160 290 180 300 200 300 C 220 300 240 290 240 270 C 240 250 220 240 200 240 C 180 240 160 250 160 260',
                    description: 'Draw the complete 6 in one continuous movement'
                }
            ]
        },
        
        7: {
            strokes: [
                {
                    id: 'complete_seven',
                    startPoint: { x: 145, y: 100 }, // Top left
                    path: 'M 145 100 L 255 100 L 180 300',
                    description: 'Draw across then diagonal down'
                }
            ]
        },
        
        8: {
            strokes: [
                {
                    id: 'figure_eight',
                    startPoint: { x: 230, y: 130 }, // Start at right of top circle
                    path: 'M 230 130 C 230 115 215 105 200 105 C 185 105 170 115 170 130 C 170 145 185 155 200 155 C 215 155 230 165 230 180 C 230 195 215 205 200 205 C 185 205 170 195 170 180 C 170 165 185 155 200 155 C 215 155 230 145 230 130',
                    description: 'Draw figure-8 starting from top right, going anticlockwise'
                }
            ]
        },
        
        9: {
            strokes: [
                {
                    id: 'complete_nine',
                    startPoint: { x: 230, y: 140 }, // Start at right of top circle
                    path: 'M 230 140 C 230 120 215 110 200 110 C 185 110 170 120 170 140 C 170 160 185 170 200 170 C 215 170 230 160 230 140 L 230 270 C 230 285 220 295 210 300',
                    description: 'Draw circle at top then stem down'
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
