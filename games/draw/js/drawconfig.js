/**
 * Draw Numbers Game Configuration
 * Responsive percentage-based layout with universal system integration
 * Updated with point-based completion system and improved timing
 */
const DRAW_CONFIG = {
    // Game progression
    NUMBERS_TO_COMPLETE: 10,
    RAINBOW_PIECES: 10,
    NUMBERS_SEQUENCE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    
    // Layout percentages (all relative to game area dimensions)
    LAYOUT: {
        // Left side reference number
        REFERENCE_NUMBER: {
            x: 25, // Centered at 25% from left
            y: 45, // Centered at 45% from top
            fontSize: 25, // 25% of game area height
        },
        REFERENCE_TEXT: {
            x: 25, // Same x as number
            y: 55, // Below the number
            fontSize: 8, // 8% of game area height (reduced from 12%)
        },
        
        // Drawing area
        DRAWING_AREA: {
            x: 45, // 45% from left edge of game area
            y: 10, // 10% from top of game area
            width: { // Dynamic width calculation
                basePercent: 20, // 20% of game area width
                heightPercent: 30 // + 30% of game area height
            },
            height: 80, // 80% of game area height
        },
        
        // Number rendering within drawing area - FIXED ASPECT RATIO
        NUMBER_RENDER: {
            x: 55, // Start at 55% from left (5% padding from drawing area)
            y: 20, // Start at 20% from top (10% padding from drawing area)
            // UPDATED: Maintain 1:2 width:height ratio using game area height
            width: 30, // 30% of game area HEIGHT (not width) to maintain ratio
            height: 60, // 60% of game area height (maintains 1:2 ratio)
        },
        
        // Redo button
        REDO_BUTTON: {
            x: 95, // Centered at 95% from left
            y: 25, // Centered at 25% from top
            size: 6, // 6% of game area width for button size
        }
    },
    
    // Visual styling (all percentage-based)
    STYLING: {
        // Reference number on left
        REFERENCE_COLOR: '#FF0000', // Red
        REFERENCE_FONT: 'Arial, sans-serif',
        REFERENCE_FONT_WEIGHT: 'bold',
        
        // Drawing area background
        DRAWING_AREA_BACKGROUND: 'rgba(255, 255, 224, 0.8)', // Pale yellow
        DRAWING_AREA_SHADOW: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)', // Enhanced shadow
        
        // Number outline to be drawn - UPDATED THICKNESS
        OUTLINE_THICKNESS: 7, // 7% of game area height (increased from 6%)
        OUTLINE_COLOR: '#CCCCCC',
        
        // White fill stroke configuration
        WHITE_FILL_RATIO: 0.8, // 80% of outline thickness for white inner stroke
        WHITE_FILL_COLOR: 'white', // Color for the white fill stroke
        
        // User drawing line
        DRAWING_LINE_THICKNESS: 4, // 4% of game area height
        DRAWING_LINE_COLOR: '#4CAF50', // Green
        
        // UPDATED: Point-based completion criteria (relaxed from 100% to 90%)
        POINT_COVERAGE_REQUIRED: 90, // Accept 18/20 points instead of requiring all 20
        POINT_TOLERANCE: 25, // Pixel tolerance for point proximity detection (unchanged)
    
        // UPDATED: Canvas flooding prevention (clarified that this is for the number render area)
        MAX_CANVAS_COVERAGE: 30, // Maximum 30% of NUMBER RENDER AREA can be filled before reset
        CANVAS_RESET_WARNING_TIME: 5000, // 5 seconds warning before reset (unchanged)
        
        // Outline styling method
        OUTLINE_METHOD: 'stroke', // 'stroke' or 'layered' - use SVG stroke for cleaner outline
    },
    
    // Audio messages organized by context
    AUDIO: {
        GAME_START: {
            WELCOME: 'Welcome to the number drawing game',
            INSTRUCTIONS: (number) => `Draw the number ${number} inside the grey outline`
        },
        
        QUESTION_START: {
            DRAW_NUMBER: (number) => `Draw the number ${number}`
        },
        
        COMPLETION: {
            WELL_DONE: 'Well done!',
            EXCELLENT: 'Excellent!',
            GREAT_JOB: 'Great job!',
            PERFECT: 'Perfect!'
        },
        
        HINTS: {
            KEEP_DRAWING: 'Keep drawing to complete the number',
            FOLLOW_OUTLINE: 'Follow the grey outline to draw the number',
            TRY_DIFFERENT_PATH: 'Try drawing a different part of the number',
            DRAW_INSIDE: 'Draw inside the number on the right',
            KEEP_DRAWING_COMPLETE: 'Keep drawing to complete the number on the right'
        },
        
        // NEW: Canvas flooding warning
        WARNINGS: {
            TOO_MUCH_AREA: 'You have covered too much area there, the board will reset in 5 seconds'
        },
        
        GAME_END: {
            ALL_COMPLETE: 'Well done! You drew all the numbers! Try again or go back to the home page.'
        },
        
        SYSTEM: {
            AUDIO_ENABLED: 'Audio enabled',
            AUDIO_DISABLED: 'Audio disabled'
        },

        FLOODING: {
            TOO_MUCH_DRAWING: 'You have drawn too much outside the number, reset and start again',
            PRESS_RESET_BUTTON: 'Press the reset button'
        },
    },

    // Line length flooding settings
    LINE_LENGTH_FLOODING: {
        HEIGHT_MULTIPLIER: 6, // 6x drawing area height
        FLASH_INTERVAL: 1000, // 1 second
        WARNING_DELAY: 10000, // 10 seconds
        FLASH_COLOR: 'rgba(255, 165, 0, 0.9)', // Orange
        NORMAL_COLOR: 'rgba(64, 64, 64, 0.9)' // Default button color
    },

    // Number word mappings
    NUMBER_WORDS: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
        5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
    },
    
    // Timing configuration - UPDATED for better user experience
    TIMING: {
        COMPLETION_IMMEDIATE_DELAY: 500, // 0.5 seconds for success feedback
        COMPLETION_ADMIRE_TIME: 1500, // 1.5 seconds to admire work
        TOTAL_COMPLETION_DELAY: 2000, // Total time before next number (500 + 1500)
        HINT_DELAY: 20000, // 20 seconds before audio hints
        VISUAL_FLASH_DELAY: 8000, // 8 seconds before visual flash
        VISUAL_FLASH_DURATION: 1000, // 1 second total flash duration (2 flashes)
        CELEBRATION_DURATION: 3000, // 3 seconds of celebration
        FADE_TRANSITION: 500 // 0.5 second transitions
    },
    
    // Coordinate system scaling
    COORDINATE_SYSTEM: {
        // Original coordinates are in 0-100 x 0-200 system
        ORIGINAL_WIDTH: 100,
        ORIGINAL_HEIGHT: 200,
        // Will be scaled to fit NUMBER_RENDER area maintaining aspect ratio
    },
    
    // Rainbow colors (for shared Rainbow component)
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    // NEW: Required completion points for each number (strategic points only)
    // These points are invisible to user but must all be covered for completion
    COMPLETION_POINTS: {
        0: [
            // Oval - evenly spaced around perimeter (20 points)
            { x: 100, y: 100 }, { x: 98, y: 128 }, { x: 92, y: 154 }, { x: 80, y: 180 },
            { x: 60, y: 198 }, { x: 50, y: 200 }, { x: 40, y: 198 }, { x: 20, y: 180 },
            { x: 8, y: 154 }, { x: 2, y: 128 }, { x: 0, y: 100 }, { x: 2, y: 72 },
            { x: 8, y: 46 }, { x: 20, y: 20 }, { x: 40, y: 2 }, { x: 50, y: 0 },
            { x: 60, y: 2 }, { x: 80, y: 20 }, { x: 92, y: 46 }, { x: 98, y: 72 }
        ],
        
        1: [
            // Vertical line - evenly spaced (12 points)
            { x: 50, y: 200 }, { x: 50, y: 180 }, { x: 50, y: 160 }, { x: 50, y: 140 },
            { x: 50, y: 120 }, { x: 50, y: 100 }, { x: 50, y: 80 }, { x: 50, y: 60 },
            { x: 50, y: 40 }, { x: 50, y: 20 }, { x: 50, y: 10 }, { x: 50, y: 0 }
        ],
        
        2: [
            // Complex curve + line (20 points)
            { x: 0, y: 150 }, { x: 4, y: 170 }, { x: 15, y: 186 }, { x: 35, y: 198 },
            { x: 50, y: 200 }, { x: 65, y: 198 }, { x: 85, y: 186 }, { x: 96, y: 170 },
            { x: 100, y: 150 }, { x: 94, y: 126 }, { x: 81, y: 108 }, { x: 63, y: 84 },
            { x: 45, y: 60 }, { x: 27, y: 36 }, { x: 9, y: 12 }, { x: 0, y: 0 },
            { x: 20, y: 0 }, { x: 40, y: 0 }, { x: 60, y: 0 }, { x: 80, y: 0 }, { x: 100, y: 0 }
        ],
        
        3: [
            // Two curves with middle connection (20 points)
            { x: 0, y: 190 }, { x: 8, y: 194 }, { x: 30, y: 200 }, { x: 55, y: 198 },
            { x: 80, y: 187 }, { x: 96, y: 168 }, { x: 100, y: 150 }, { x: 98, y: 137 },
            { x: 85, y: 118 }, { x: 60, y: 103 }, { x: 35, y: 100 }, { x: 60, y: 97 },
            { x: 85, y: 82 }, { x: 98, y: 63 }, { x: 100, y: 50 }, { x: 96, y: 32 },
            { x: 80, y: 13 }, { x: 55, y: 2 }, { x: 30, y: 0 }, { x: 8, y: 6 }, { x: 0, y: 10 }
        ],
        
        4: [
            // Two strokes - angle line + vertical line (20 points total)
            // Stroke 1: Angle line (first/last + evenly spaced)
            { x: 30, y: 200 }, { x: 24, y: 176 }, { x: 18, y: 152 }, { x: 12, y: 128 },
            { x: 6, y: 104 }, { x: 0, y: 80 }, { x: 20, y: 80 }, { x: 40, y: 80 },
            { x: 60, y: 80 }, { x: 80, y: 80 }, { x: 100, y: 80 },
            // Stroke 2: Vertical line (first/last + evenly spaced)
            { x: 60, y: 140 }, { x: 60, y: 120 }, { x: 60, y: 100 }, { x: 60, y: 80 },
            { x: 60, y: 60 }, { x: 60, y: 40 }, { x: 60, y: 20 }, { x: 60, y: 10 }, { x: 60, y: 0 }
        ],
        
        5: [
            // Two strokes - horizontal + vertical/curve (20 points total)
            // Stroke 1: Top horizontal (first/last + evenly spaced)
            { x: 0, y: 200 }, { x: 20, y: 200 }, { x: 40, y: 200 }, { x: 60, y: 200 },
            { x: 80, y: 200 }, { x: 100, y: 200 },
            // Stroke 2: Vertical and curve (first/last + key points)
            { x: 0, y: 200 }, { x: 0, y: 170 }, { x: 0, y: 140 }, { x: 0, y: 125 },
            { x: 15, y: 125 }, { x: 35, y: 124 }, { x: 55, y: 120 }, { x: 75, y: 109 },
            { x: 90, y: 94 }, { x: 100, y: 63 }, { x: 94, y: 36 }, { x: 80, y: 17 },
            { x: 60, y: 4 }, { x: 40, y: 0 }, { x: 20, y: 3 }, { x: 8, y: 7 }, { x: 0, y: 13 }
        ],
        
        6: [
            // Single complex stroke (20 points)
            { x: 65, y: 200 }, { x: 45, y: 191 }, { x: 25, y: 167 }, { x: 10, y: 132 },
            { x: 4, y: 107 }, { x: 1, y: 84 }, { x: 0, y: 60 }, { x: 4, y: 36 },
            { x: 15, y: 17 }, { x: 35, y: 3 }, { x: 50, y: 0 }, { x: 70, y: 5 },
            { x: 85, y: 17 }, { x: 96, y: 36 }, { x: 100, y: 60 }, { x: 96, y: 84 },
            { x: 85, y: 103 }, { x: 65, y: 117 }, { x: 45, y: 120 }, { x: 25, y: 112 }, { x: 10, y: 96 }
        ],
        
        7: [
            // Single stroke - horizontal + diagonal (15 points)
            { x: 0, y: 200 }, { x: 20, y: 200 }, { x: 40, y: 200 }, { x: 60, y: 200 },
            { x: 80, y: 200 }, { x: 100, y: 200 }, { x: 90, y: 167 }, { x: 80, y: 133 },
            { x: 70, y: 100 }, { x: 60, y: 67 }, { x: 50, y: 33 }, { x: 45, y: 17 }, { x: 40, y: 0 }
        ],
        
        8: [
            // Figure-8 shape (22 points for thorough coverage)
            { x: 95, y: 152.5 }, { x: 90, y: 174.5 }, { x: 75, y: 192 }, { x: 50, y: 200 },
            { x: 25, y: 192 }, { x: 10, y: 174.5 }, { x: 5, y: 152.5 }, { x: 10, y: 130.5 },
            { x: 25, y: 113 }, { x: 50, y: 105 }, { x: 75, y: 113 }, { x: 90, y: 130.5 },
            { x: 96, y: 73 }, { x: 100, y: 52.5 }, { x: 94, y: 27.5 }, { x: 80, y: 10.5 },
            { x: 60, y: 1 }, { x: 50, y: 0 }, { x: 40, y: 1 }, { x: 20, y: 10.5 },
            { x: 6, y: 27.5 }, { x: 0, y: 52.5 }
        ],
        
        9: [
            // Top loop + descending line (27 points)
            { x: 95, y: 150 }, { x: 85, y: 181 }, { x: 65, y: 196 }, { x: 45, y: 200 },
            { x: 25, y: 194 }, { x: 10, y: 181 }, { x: 2, y: 164 }, { x: 0, y: 150 },
            { x: 4, y: 130 }, { x: 15, y: 114 }, { x: 35, y: 102 }, { x: 50, y: 100 },
            { x: 65, y: 104 }, { x: 80, y: 114 }, { x: 90, y: 128 }, { x: 94, y: 140 },
            { x: 96, y: 158 }, { x: 98, y: 174 }, { x: 99, y: 182 }, { x: 97, y: 159 },
            { x: 94, y: 137 }, { x: 92, y: 114 }, { x: 90, y: 91 }, { x: 87, y: 68 },
            { x: 85, y: 46 }, { x: 82, y: 23 }, { x: 80, y: 0 }
        ]
    },
    
    // Stroke definitions for each number (same coordinate system as before)
    STROKE_DEFINITIONS: {
        0: {
            strokes: [{
                id: 'oval_coords',
                coordinates: [
                    { x: 100, y: 100 }, { x: 99, y: 120 }, { x: 98, y: 128 }, { x: 96, y: 139 }, 
                    { x: 94, y: 147 }, { x: 92, y: 154 }, { x: 90, y: 160 }, { x: 85, y: 171 }, 
                    { x: 80, y: 180 }, { x: 75, y: 187 }, { x: 70, y: 192 }, { x: 65, y: 195 }, 
                    { x: 60, y: 198 }, { x: 55, y: 199 }, { x: 50, y: 200 }, { x: 45, y: 199 }, 
                    { x: 40, y: 198 }, { x: 35, y: 195 }, { x: 30, y: 192 }, { x: 25, y: 187 }, 
                    { x: 20, y: 180 }, { x: 15, y: 171 }, { x: 10, y: 160 }, { x: 8, y: 154 }, 
                    { x: 6, y: 147 }, { x: 4, y: 139 }, { x: 2, y: 128 }, { x: 1, y: 120 }, 
                    { x: 0, y: 100 }, { x: 1, y: 80 }, { x: 2, y: 72 }, { x: 4, y: 61 }, 
                    { x: 6, y: 53 }, { x: 8, y: 46 }, { x: 10, y: 40 }, { x: 15, y: 29 }, 
                    { x: 20, y: 20 }, { x: 25, y: 13 }, { x: 30, y: 8 }, { x: 35, y: 5 }, 
                    { x: 40, y: 2 }, { x: 45, y: 1 }, { x: 50, y: 0 }, { x: 55, y: 1 }, 
                    { x: 60, y: 2 }, { x: 65, y: 5 }, { x: 70, y: 8 }, { x: 75, y: 13 }, 
                    { x: 80, y: 20 }, { x: 85, y: 29 }, { x: 90, y: 40 }, { x: 92, y: 46 }, 
                    { x: 94, y: 53 }, { x: 96, y: 61 }, { x: 98, y: 72 }, { x: 99, y: 80 }, 
                    { x: 100, y: 100 }
                ]
            }]
        },
        1: {
            strokes: [{
                id: 'line',
                coordinates: [
                    { x: 50, y: 200 }, { x: 50, y: 190 }, { x: 50, y: 180 }, { x: 50, y: 170 },
                    { x: 50, y: 160 }, { x: 50, y: 150 }, { x: 50, y: 140 }, { x: 50, y: 130 },
                    { x: 50, y: 120 }, { x: 50, y: 110 }, { x: 50, y: 100 }, { x: 50, y: 90 },
                    { x: 50, y: 80 }, { x: 50, y: 70 }, { x: 50, y: 60 }, { x: 50, y: 50 },
                    { x: 50, y: 40 }, { x: 50, y: 30 }, { x: 50, y: 20 }, { x: 50, y: 10 },
                    { x: 50, y: 0 }
                ]
            }]
        },
        2: {
            strokes: [{
                id: 'complete_two_coords',
                coordinates: [
                    { x: 0, y: 150 }, { x: 1, y: 160 }, { x: 2, y: 164 }, { x: 4, y: 170 }, 
                    { x: 6, y: 174 }, { x: 8, y: 177 }, { x: 10, y: 180 }, { x: 15, y: 186 }, 
                    { x: 20, y: 190 }, { x: 25, y: 193 }, { x: 30, y: 196 }, { x: 35, y: 198 }, 
                    { x: 40, y: 199 }, { x: 45, y: 200 }, { x: 50, y: 200 }, { x: 55, y: 200 }, 
                    { x: 60, y: 199 }, { x: 65, y: 198 }, { x: 70, y: 196 }, { x: 75, y: 193 }, 
                    { x: 80, y: 190 }, { x: 85, y: 186 }, { x: 90, y: 180 }, { x: 92, y: 177 }, 
                    { x: 94, y: 174 }, { x: 96, y: 170 }, { x: 98, y: 164 }, { x: 99, y: 160 }, 
                    { x: 100, y: 150 }, { x: 99, y: 140 }, { x: 98, y: 136 }, { x: 96, y: 130 }, 
                    { x: 94, y: 126 }, { x: 92, y: 123 }, { x: 90, y: 120 }, { x: 81, y: 108 }, 
                    { x: 72, y: 96 }, { x: 63, y: 84 }, { x: 54, y: 72 }, { x: 45, y: 60 }, 
                    { x: 36, y: 48 }, { x: 27, y: 36 }, { x: 18, y: 24 }, { x: 9, y: 12 }, 
                    { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }, 
                    { x: 40, y: 0 }, { x: 50, y: 0 }, { x: 60, y: 0 }, { x: 70, y: 0 }, 
                    { x: 80, y: 0 }, { x: 90, y: 0 }, { x: 100, y: 0 }
                ]
            }]
        },
        3: {
            strokes: [{
                id: 'three_coords',
                coordinates: [
                    { x: 0, y: 190 }, { x: 1, y: 191 }, { x: 2, y: 191 }, { x: 4, y: 192 }, 
                    { x: 6, y: 193 }, { x: 8, y: 194 }, { x: 10, y: 195 }, { x: 15, y: 197 }, 
                    { x: 20, y: 198 }, { x: 25, y: 199 }, { x: 30, y: 200 }, { x: 35, y: 200 }, 
                    { x: 40, y: 200 }, { x: 45, y: 200 }, { x: 50, y: 199 }, { x: 55, y: 198 }, 
                    { x: 60, y: 197 }, { x: 65, y: 195 }, { x: 70, y: 193 }, { x: 75, y: 190 }, 
                    { x: 80, y: 187 }, { x: 85, y: 182 }, { x: 90, y: 177 }, { x: 92, y: 174 }, 
                    { x: 94, y: 171 }, { x: 96, y: 168 }, { x: 98, y: 163 }, { x: 99, y: 159 }, 
                    { x: 100, y: 150 }, { x: 99, y: 141 }, { x: 98, y: 137 }, { x: 96, y: 132 }, 
                    { x: 94, y: 129 }, { x: 92, y: 126 }, { x: 90, y: 123 }, { x: 85, y: 118 }, 
                    { x: 80, y: 113 }, { x: 75, y: 110 }, { x: 70, y: 107 }, { x: 65, y: 105 }, 
                    { x: 60, y: 103 }, { x: 55, y: 102 }, { x: 50, y: 101 }, { x: 45, y: 100.1 }, 
                    { x: 40, y: 100.1 }, { x: 35, y: 100 }, { x: 40, y: 99.9 }, { x: 45, y: 99.1 }, 
                    { x: 50, y: 99 }, { x: 55, y: 98 }, { x: 60, y: 97 }, { x: 65, y: 95 }, 
                    { x: 70, y: 93 }, { x: 75, y: 90 }, { x: 80, y: 87 }, { x: 85, y: 82 }, 
                    { x: 90, y: 77 }, { x: 92, y: 74 }, { x: 94, y: 71 }, { x: 96, y: 68 }, 
                    { x: 98, y: 63 }, { x: 99, y: 59 }, { x: 100, y: 50 }, { x: 99, y: 41 }, 
                    { x: 98, y: 37 }, { x: 96, y: 32 }, { x: 94, y: 29 }, { x: 92, y: 26 }, 
                    { x: 90, y: 23 }, { x: 85, y: 18 }, { x: 80, y: 13 }, { x: 75, y: 10 }, 
                    { x: 70, y: 7 }, { x: 65, y: 5 }, { x: 60, y: 3 }, { x: 55, y: 2 }, 
                    { x: 50, y: 1 }, { x: 45, y: 0 }, { x: 40, y: 0 }, { x: 35, y: 0 }, 
                    { x: 30, y: 0 }, { x: 25, y: 1 }, { x: 20, y: 2 }, { x: 15, y: 3 }, 
                    { x: 10, y: 5 }, { x: 8, y: 6 }, { x: 6, y: 7 }, { x: 4, y: 8 }, 
                    { x: 2, y: 9 }, { x: 1, y: 9 }, { x: 0, y: 10 }
                ]
            }]
        },
        4: {
            strokes: [
                {
                    id: 'angle_line',
                    coordinates: [
                        { x: 30, y: 200 }, { x: 27, y: 188 }, { x: 24, y: 176 }, { x: 21, y: 164 }, 
                        { x: 18, y: 152 }, { x: 15, y: 140 }, { x: 12, y: 128 }, { x: 9, y: 116 }, 
                        { x: 6, y: 104 }, { x: 3, y: 92 }, { x: 0, y: 80 }, { x: 10, y: 80 }, 
                        { x: 20, y: 80 }, { x: 30, y: 80 }, { x: 40, y: 80 }, { x: 50, y: 80 }, 
                        { x: 60, y: 80 }, { x: 70, y: 80 }, { x: 80, y: 80 }, { x: 90, y: 80 }, 
                        { x: 100, y: 80 }
                    ]
                },
                {
                    id: 'vertical_line',
                    coordinates: [
                        { x: 60, y: 140 }, { x: 60, y: 130 }, { x: 60, y: 120 }, { x: 60, y: 110 }, 
                        { x: 60, y: 100 }, { x: 60, y: 90 }, { x: 60, y: 80 }, { x: 60, y: 70 }, 
                        { x: 60, y: 60 }, { x: 60, y: 50 }, { x: 60, y: 40 }, { x: 60, y: 30 }, 
                        { x: 60, y: 20 }, { x: 60, y: 10 }, { x: 60, y: 0 }
                    ]
                }
            ]
        },
        5: {
            strokes: [
                {
                    id: 'top_horizontal',
                    coordinates: [
                        { x: 0, y: 200 }, { x: 10, y: 200 }, { x: 20, y: 200 }, { x: 30, y: 200 }, 
                        { x: 40, y: 200 }, { x: 50, y: 200 }, { x: 60, y: 200 }, { x: 70, y: 200 }, 
                        { x: 80, y: 200 }, { x: 90, y: 200 }, { x: 100, y: 200 }
                    ]
                },
                {
                    id: 'vertical_and_curve',
                    coordinates: [
                        { x: 0, y: 200 }, { x: 0, y: 190 }, { x: 0, y: 180 }, { x: 0, y: 170 }, 
                        { x: 0, y: 160 }, { x: 0, y: 150 }, { x: 0, y: 140 }, { x: 0, y: 130 }, 
                        { x: 0, y: 125 }, { x: 5, y: 125 }, { x: 10, y: 125 }, { x: 15, y: 125 }, 
                        { x: 20, y: 125 }, { x: 25, y: 125 }, { x: 30, y: 125 }, 
                        { x: 35, y: 124 }, { x: 40, y: 124 }, { x: 45, y: 123 }, { x: 50, y: 121 }, 
                        { x: 55, y: 120 }, { x: 60, y: 118 }, { x: 65, y: 115 }, { x: 70, y: 113 }, 
                        { x: 75, y: 109 }, { x: 80, y: 105 }, { x: 85, y: 100 }, { x: 90, y: 94 }, 
                        { x: 92, y: 91 }, { x: 94, y: 87 }, { x: 96, y: 83 }, { x: 98, y: 77 }, 
                        { x: 99, y: 73 }, { x: 100, y: 63 }, { x: 99, y: 51 }, { x: 98, y: 47 }, 
                        { x: 96, y: 41 }, { x: 94, y: 36 }, { x: 92, y: 32 }, { x: 90, y: 29 }, 
                        { x: 85, y: 22 }, { x: 80, y: 17 }, { x: 75, y: 13 }, { x: 70, y: 9 }, 
                        { x: 65, y: 6 }, { x: 60, y: 4 }, { x: 55, y: 3 }, { x: 50, y: 1 }, 
                        { x: 45, y: 0 }, { x: 40, y: 0 }, { x: 35, y: 0 }, { x: 30, y: 0 }, 
                        { x: 25, y: 1 }, { x: 20, y: 3 }, { x: 15, y: 4 }, { x: 10, y: 6 }, 
                        { x: 8, y: 7 }, { x: 6, y: 9 }, { x: 4, y: 10 }, { x: 2, y: 11 }, 
                        { x: 1, y: 12 }, { x: 0, y: 13 }
                    ]
                }
            ]
        },
        6: {
            strokes: [{
                id: 'six_coords',
                coordinates: [
                    { x: 65, y: 200 }, { x: 60, y: 199 }, { x: 55, y: 197 }, { x: 50, y: 194 }, 
                    { x: 45, y: 191 }, { x: 40, y: 186 }, { x: 35, y: 181 }, { x: 30, y: 175 }, 
                    { x: 25, y: 167 }, { x: 20, y: 158 }, { x: 15, y: 147 }, { x: 10, y: 132 }, 
                    { x: 8, y: 125 }, { x: 6, y: 117 }, { x: 4, y: 107 }, { x: 2, y: 93 }, 
                    { x: 1, y: 84 }, { x: 0, y: 60 }, { x: 1, y: 48 }, { x: 2, y: 43 }, 
                    { x: 4, y: 36 }, { x: 6, y: 32 }, { x: 8, y: 27 }, { x: 10, y: 24 }, 
                    { x: 15, y: 17 }, { x: 20, y: 12 }, { x: 25, y: 8 }, { x: 30, y: 5 }, 
                    { x: 35, y: 3 }, { x: 40, y: 1 }, { x: 45, y: 0 }, { x: 50, y: 0 }, 
                    { x: 55, y: 0 }, { x: 60, y: 1 }, { x: 65, y: 3 }, { x: 70, y: 5 }, 
                    { x: 75, y: 8 }, { x: 80, y: 12 }, { x: 85, y: 17 }, { x: 90, y: 24 }, 
                    { x: 92, y: 27 }, { x: 94, y: 32 }, { x: 96, y: 36 }, { x: 98, y: 43 }, 
                    { x: 99, y: 48 }, { x: 100, y: 60 }, { x: 99, y: 72 }, { x: 98, y: 77 }, 
                    { x: 96, y: 84 }, { x: 94, y: 88 }, { x: 92, y: 93 }, { x: 90, y: 96 }, 
                    { x: 85, y: 103 }, { x: 80, y: 108 }, { x: 75, y: 112 }, { x: 70, y: 115 }, 
                    { x: 65, y: 117 }, { x: 60, y: 119 }, { x: 55, y: 120 }, { x: 50, y: 120 }, 
                    { x: 45, y: 120 }, { x: 40, y: 119 }, { x: 35, y: 117 }, { x: 30, y: 115 }, 
                    { x: 25, y: 112 }, { x: 20, y: 108 }, { x: 15, y: 103 }, { x: 10, y: 96 }, 
                    { x: 8, y: 93 }, { x: 6, y: 88 }, { x: 4, y: 84 }, { x: 2, y: 77 }, 
                    { x: 1, y: 72 }, { x: 0, y: 60 }
                ]
            }]
        },
        7: {
            strokes: [{
                id: 'seven_coords',
                coordinates: [
                    { x: 0, y: 200 }, { x: 10, y: 200 }, { x: 20, y: 200 }, { x: 30, y: 200 }, 
                    { x: 40, y: 200 }, { x: 50, y: 200 }, { x: 60, y: 200 }, { x: 70, y: 200 }, 
                    { x: 80, y: 200 }, { x: 90, y: 200 }, { x: 100, y: 200 }, { x: 95, y: 183 }, 
                    { x: 90, y: 167 }, { x: 85, y: 150 }, { x: 80, y: 133 }, { x: 75, y: 117 }, 
                    { x: 70, y: 100 }, { x: 65, y: 83 }, { x: 60, y: 67 }, { x: 55, y: 50 }, 
                    { x: 50, y: 33 }, { x: 45, y: 17 }, { x: 40, y: 0 }
                ]
            }]
        },
        8: {
            strokes: [{
                id: 'eight_coords',
                coordinates: [
                    { x: 95, y: 152.5 }, { x: 94, y: 162.5 }, { x: 92, y: 169.5 }, { x: 90, y: 174.5 }, 
                    { x: 85, y: 182.5 }, { x: 80, y: 188 }, { x: 75, y: 192 }, { x: 70, y: 195 }, 
                    { x: 65, y: 197.5 }, { x: 60, y: 199 }, { x: 55, y: 199.5 }, { x: 50, y: 200 }, 
                    { x: 45, y: 199.5 }, { x: 40, y: 199 }, { x: 35, y: 197.5 }, { x: 30, y: 195 }, 
                    { x: 25, y: 192 }, { x: 20, y: 188 }, { x: 15, y: 182.5 }, { x: 10, y: 174.5 }, 
                    { x: 8, y: 169.5 }, { x: 6, y: 162.5 }, { x: 5, y: 152.5 }, { x: 6, y: 142.5 }, 
                    { x: 8, y: 135.5 }, { x: 10, y: 130.5 }, { x: 15, y: 122.5 }, { x: 20, y: 117 }, 
                    { x: 25, y: 113 }, { x: 30, y: 110 }, { x: 35, y: 107.5 }, { x: 40, y: 106 }, 
                    { x: 45, y: 105.5 }, { x: 50, y: 105 }, { x: 55, y: 104.5 }, { x: 60, y: 104 }, 
                    { x: 65, y: 102.5 }, { x: 70, y: 100.5 }, { x: 75, y: 98 }, { x: 80, y: 94.5 }, 
                    { x: 85, y: 90 }, { x: 90, y: 84 }, { x: 92, y: 81 }, { x: 94, y: 77.5 }, 
                    { x: 96, y: 73 }, { x: 98, y: 67 }, { x: 99, y: 63 }, { x: 100, y: 52.5 }, 
                    { x: 99, y: 42 }, { x: 98, y: 38 }, { x: 96, y: 32 }, { x: 94, y: 27.5 }, 
                    { x: 92, y: 24 }, { x: 90, y: 21 }, { x: 85, y: 15 }, { x: 80, y: 10.5 }, 
                    { x: 75, y: 7 }, { x: 70, y: 4.5 }, { x: 65, y: 2.5 }, { x: 60, y: 1 }, 
                    { x: 55, y: 0.5 }, { x: 50, y: 0 }, { x: 45, y: 0.5 }, { x: 40, y: 1 }, 
                    { x: 35, y: 2.5 }, { x: 30, y: 4.5 }, { x: 25, y: 7 }, { x: 20, y: 10.5 }, 
                    { x: 15, y: 15 }, { x: 10, y: 21 }, { x: 8, y: 24 }, { x: 6, y: 27.5 }, 
                    { x: 4, y: 32 }, { x: 2, y: 38 }, { x: 1, y: 42 }, { x: 0, y: 52.5 }, 
                    { x: 1, y: 63 }, { x: 2, y: 67 }, { x: 4, y: 73 }, { x: 6, y: 77.5 }, 
                    { x: 8, y: 81 }, { x: 10, y: 84 }, { x: 15, y: 90 }, { x: 20, y: 94.5 }, 
                    { x: 25, y: 98 }, { x: 30, y: 100.5 }, { x: 35, y: 102.5 }, { x: 40, y: 104 }, 
                    { x: 45, y: 104.5 }, { x: 50, y: 105 }, { x: 55, y: 105.5 }, { x: 60, y: 106 }, 
                    { x: 65, y: 107.5 }, { x: 70, y: 110 }, { x: 75, y: 113 }, { x: 80, y: 117 }, 
                    { x: 85, y: 122.5 }, { x: 90, y: 130.5 }, { x: 92, y: 135.5 }, { x: 94, y: 142.5 }, 
                    { x: 95, y: 152.5 }
                ]
            }]
        },
        9: {
            strokes: [{
                id: 'nine_coords',
                coordinates: [
                    { x: 95, y: 150 }, { x: 94, y: 160 }, { x: 92, y: 167 }, { x: 90, y: 172 }, 
                    { x: 85, y: 181 }, { x: 80, y: 186 }, { x: 75, y: 191 }, { x: 70, y: 194 }, 
                    { x: 65, y: 196 }, { x: 60, y: 198 }, { x: 55, y: 199 }, { x: 50, y: 200 }, 
                    { x: 45, y: 200 }, { x: 40, y: 199 }, { x: 35, y: 198 }, { x: 30, y: 196 }, 
                    { x: 25, y: 194 }, { x: 20, y: 191 }, { x: 15, y: 186 }, { x: 10, y: 181 }, 
                    { x: 8, y: 178 }, { x: 6, y: 174 }, { x: 4, y: 170 }, { x: 2, y: 164 }, 
                    { x: 1, y: 160 }, { x: 0, y: 150 }, { x: 1, y: 140 }, { x: 2, y: 136 }, 
                    { x: 4, y: 130 }, { x: 6, y: 126 }, { x: 8, y: 122 }, { x: 10, y: 119 }, 
                    { x: 15, y: 114 }, { x: 20, y: 109 }, { x: 25, y: 106 }, { x: 30, y: 104 }, 
                    { x: 35, y: 102 }, { x: 40, y: 101 }, { x: 45, y: 100 }, { x: 50, y: 100 }, 
                    { x: 55, y: 101 }, { x: 60, y: 102 }, { x: 65, y: 104 }, { x: 70, y: 106 }, 
                    { x: 75, y: 109 }, { x: 80, y: 114 }, { x: 85, y: 119 }, { x: 90, y: 128 }, 
                    { x: 92, y: 133 }, { x: 94, y: 140 }, { x: 94.9, y: 150 }, { x: 95.9, y: 158 }, 
                    { x: 96.9, y: 166 }, { x: 97.9, y: 174 }, { x: 98.9, y: 182 }, { x: 100, y: 190 }, 
                    { x: 99, y: 182 }, { x: 98, y: 174 }, { x: 97, y: 166 }, { x: 96, y: 158 }, 
                    { x: 95, y: 150 }, { x: 94, y: 140 }, { x: 93, y: 130 }, { x: 92, y: 120 }, 
                    { x: 91, y: 110 }, { x: 90, y: 100 }, { x: 89, y: 90 }, { x: 88, y: 80 }, 
                    { x: 87, y: 70 }, { x: 86, y: 60 }, { x: 85, y: 50 }, { x: 84, y: 40 }, 
                    { x: 83, y: 30 }, { x: 82, y: 20 }, { x: 81, y: 10 }, { x: 80, y: 0 }
                ]
            }]
        }
    },
    
    // Debug and development settings
    DEBUG_MODE: false,
    
    // Helper functions
    getRandomEncouragement() {
        const encouragements = [
            this.AUDIO.COMPLETION.WELL_DONE,
            this.AUDIO.COMPLETION.EXCELLENT,
            this.AUDIO.COMPLETION.GREAT_JOB,
            this.AUDIO.COMPLETION.PERFECT
        ];
        return encouragements[Math.floor(Math.random() * encouragements.length)];
    },
    
    getNumberWord(number) {
        return this.NUMBER_WORDS[number] || number.toString();
    },
    
    // Calculate number bounds for legacy area coverage checking (fallback)
    calculateNumberBounds(number) {
        const numberConfig = this.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) return null;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        numberConfig.strokes.forEach(stroke => {
            if (stroke.coordinates) {
                stroke.coordinates.forEach(coord => {
                    minX = Math.min(minX, coord.x);
                    maxX = Math.max(maxX, coord.x);
                    minY = Math.min(minY, coord.y);
                    maxY = Math.max(maxY, coord.y);
                });
            }
        });
        
        return { minX, maxX, minY, maxY };
    },
    
    // NEW: Get completion points for a specific number
    getCompletionPoints(number) {
        return this.COMPLETION_POINTS[number] || null;
    },
    
    // NEW: Check if point-based completion is available for a number
    hasCompletionPoints(number) {
        return this.COMPLETION_POINTS[number] && this.COMPLETION_POINTS[number].length > 0;
    },
    
    // Calculate proper aspect ratio bounds for number rendering
    calculateAspectRatioBounds(gameAreaDimensions) {
        if (!gameAreaDimensions) return null;
        
        const { width, height } = gameAreaDimensions;
        
        // Calculate render area dimensions maintaining 1:2 aspect ratio
        const renderHeight = (height * this.LAYOUT.NUMBER_RENDER.height) / 100;
        const renderWidth = renderHeight / 2; // Maintain 1:2 ratio (width:height)
        
        // Calculate position (still using percentages for x, but calculating width from height)
        const renderX = (width * this.LAYOUT.NUMBER_RENDER.x) / 100;
        const renderY = (height * this.LAYOUT.NUMBER_RENDER.y) / 100;
        
        return {
            x: renderX,
            y: renderY,
            width: renderWidth,
            height: renderHeight
        };
    }
};

// Create alias for compatibility with shared components (Rainbow, Bear)
const CONFIG = {
    ...DRAW_CONFIG,
    RAINBOW_PIECES: DRAW_CONFIG.RAINBOW_PIECES,
    RAINBOW_COLORS: DRAW_CONFIG.RAINBOW_COLORS
};
