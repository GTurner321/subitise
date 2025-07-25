const DRAW_CONFIG = {
    NUMBERS_TO_COMPLETE: 10,
    RAINBOW_PIECES: 10,
    
    // Drawing area dimensions - enhanced for better layout
    get REFERENCE_WIDTH() {
        return Math.min(window.innerWidth * 0.3, 350);
    },
    get REFERENCE_HEIGHT() {
        // Made 20% taller as requested
        return Math.min(window.innerHeight * 0.72, 540);
    },
    get DRAWING_WIDTH() {
        return Math.min(window.innerWidth * 0.6, 650);
    },
    get DRAWING_HEIGHT() {
        return Math.min(window.innerHeight * 0.75, 700);
    },
    
    // Reference number styling - enhanced for better visibility
    REFERENCE_OUTLINE_WIDTH: 45, // Made 50% thicker (30 * 1.5)
    REFERENCE_WHITE_WIDTH: 30,   // Made 50% thicker (20 * 1.5) - this is actually the red line
    REFERENCE_OUTLINE_COLOR: '#2C2C2C',
    REFERENCE_WHITE_COLOR: '#FF0000', // Changed to red for the inner line
    
    // Drawing canvas styling - maintained proportions
    DRAWING_OUTLINE_WIDTH: 54,
    DRAWING_WHITE_WIDTH: 48,
    DRAWING_OUTLINE_COLOR: '#CCCCCC',
    DRAWING_STROKE_COLOR: '#4CAF50',
    DRAWING_STROKE_WIDTH: 8,
    
    // Enhanced drawing detection with coverage requirements
    DRAWING_TOLERANCE: 25,
    MIN_COVERAGE_PERCENTAGE: 60,
    MIN_VERTICAL_COVERAGE: 75,   // New: minimum vertical coverage requirement
    MIN_HORIZONTAL_COVERAGE: 75, // New: minimum horizontal coverage requirement
    
    COMPLETION_DELAY: 2000,
    AUDIO_ENABLED: true,
    
    BEAR_IMAGE_PATH: '../../assets/bear.png',
    
    NUMBER_WORDS: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
        5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
    },
    
    // Stroke definitions remain the same - coordinate system intact
    STROKE_DEFINITIONS: {
        0: {
            strokes: [{
                id: 'oval_coords',
                startPoint: { x: 240, y: 200 },
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
                ],
                description: 'Draw 0 using precise coordinates starting from right center',
                type: 'coordinates'
            }]
        },
        1: {
            strokes: [{
                id: 'line',
                startPoint: { x: 200, y: 100 },
                coordinates: [
                    { x: 50, y: 200 }, { x: 50, y: 190 }, { x: 50, y: 180 }, { x: 50, y: 170 },
                    { x: 50, y: 160 }, { x: 50, y: 150 }, { x: 50, y: 140 }, { x: 50, y: 130 },
                    { x: 50, y: 120 }, { x: 50, y: 110 }, { x: 50, y: 100 }, { x: 50, y: 90 },
                    { x: 50, y: 80 }, { x: 50, y: 70 }, { x: 50, y: 60 }, { x: 50, y: 50 },
                    { x: 50, y: 40 }, { x: 50, y: 30 }, { x: 50, y: 20 }, { x: 50, y: 10 },
                    { x: 50, y: 0 }
                ],
                description: 'Draw down',
                type: 'coordinates'
            }]
        },
        2: {
            strokes: [{
                id: 'complete_two_coords',
                startPoint: { x: 140, y: 250 },
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
                ],
                description: 'Draw 2 using precise coordinates with full path',
                type: 'coordinates'
            }]
        },
        3: {
            strokes: [{
                id: 'three_coords',
                startPoint: { x: 140, y: 110 },
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
                ],
                description: 'Draw 3 using precise coordinates with directional preference',
                type: 'coordinates'
            }]
        },
        4: {
            strokes: [
                {
                    id: 'angle_line',
                    startPoint: { x: 170, y: 300 },
                    coordinates: [
                        { x: 30, y: 200 }, { x: 27, y: 188 }, { x: 24, y: 176 }, { x: 21, y: 164 }, 
                        { x: 18, y: 152 }, { x: 15, y: 140 }, { x: 12, y: 128 }, { x: 9, y: 116 }, 
                        { x: 6, y: 104 }, { x: 3, y: 92 }, { x: 0, y: 80 }, { x: 10, y: 80 }, 
                        { x: 20, y: 80 }, { x: 30, y: 80 }, { x: 40, y: 80 }, { x: 50, y: 80 }, 
                        { x: 60, y: 80 }, { x: 70, y: 80 }, { x: 80, y: 80 }, { x: 90, y: 80 }, 
                        { x: 100, y: 80 }
                    ],
                    description: 'Draw the angled line and horizontal line with full coordinates',
                    type: 'coordinates'
                },
                {
                    id: 'vertical_line',
                    startPoint: { x: 260, y: 240 },
                    coordinates: [
                        { x: 60, y: 140 }, { x: 60, y: 130 }, { x: 60, y: 120 }, { x: 60, y: 110 }, 
                        { x: 60, y: 100 }, { x: 60, y: 90 }, { x: 60, y: 80 }, { x: 60, y: 70 }, 
                        { x: 60, y: 60 }, { x: 60, y: 50 }, { x: 60, y: 40 }, { x: 60, y: 30 }, 
                        { x: 60, y: 20 }, { x: 60, y: 10 }, { x: 60, y: 0 }
                    ],
                    description: 'Draw the vertical line with full coordinates',
                    type: 'coordinates'
                }
            ]
        },
        5: {
            strokes: [
                {
                    id: 'top_horizontal',
                    startPoint: { x: 140, y: 100 },
                    coordinates: [
                        { x: 0, y: 200 }, { x: 10, y: 200 }, { x: 20, y: 200 }, { x: 30, y: 200 }, 
                        { x: 40, y: 200 }, { x: 50, y: 200 }, { x: 60, y: 200 }, { x: 70, y: 200 }, 
                        { x: 80, y: 200 }, { x: 90, y: 200 }, { x: 100, y: 200 }
                    ],
                    description: 'Draw the top horizontal line with more points',
                    type: 'coordinates'
                },
                {
                    id: 'vertical_and_curve',
                    startPoint: { x: 140, y: 100 },
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
                    ],
                    description: 'Draw the vertical line and curved bottom section with more points',
                    type: 'coordinates'
                }
            ]
        },
        6: {
            strokes: [{
                id: 'six_coords',
                startPoint: { x: 218, y: 100 },
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
                ],
                description: 'Draw 6 using precise coordinates',
                type: 'coordinates'
            }]
        },
        7: {
            strokes: [{
                id: 'seven_coords',
                startPoint: { x: 140, y: 300 },
                coordinates: [
                    { x: 0, y: 200 }, { x: 10, y: 200 }, { x: 20, y: 200 }, { x: 30, y: 200 }, 
                    { x: 40, y: 200 }, { x: 50, y: 200 }, { x: 60, y: 200 }, { x: 70, y: 200 }, 
                    { x: 80, y: 200 }, { x: 90, y: 200 }, { x: 100, y: 200 }, { x: 95, y: 183 }, 
                    { x: 90, y: 167 }, { x: 85, y: 150 }, { x: 80, y: 133 }, { x: 75, y: 117 }, 
                    { x: 70, y: 100 }, { x: 65, y: 83 }, { x: 60, y: 67 }, { x: 55, y: 50 }, 
                    { x: 50, y: 33 }, { x: 45, y: 17 }, { x: 40, y: 0 }
                ],
                description: 'Draw 7 with full coordinates including corner transition',
                type: 'coordinates'
            }]
        },
        8: {
            strokes: [{
                id: 'eight_coords',
                startPoint: { x: 254, y: 147.5 },
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
                ],
                description: 'Draw 8 using precise coordinates',
                type: 'coordinates'
            }]
        },
        9: {
            strokes: [{
                id: 'nine_coords',
                startPoint: { x: 235, y: 250 },
                coordinates: [
                    {x: 95, y: 150}, {x: 94, y: 160}, {x: 92, y: 167}, {x: 90, y: 172}, 
                    {x: 85, y: 181}, {x: 80, y: 186}, {x: 75, y: 191}, {x: 70, y: 194}, 
                    {x: 65, y: 196}, {x: 60, y: 198}, {x: 55, y: 199}, {x: 50, y: 200}, 
                    {x: 45, y: 200}, {x: 40, y: 199}, {x: 35, y: 198}, {x: 30, y: 196}, 
                    {x: 25, y: 194}, {x: 20, y: 191}, {x: 15, y: 186}, {x: 10, y: 181}, 
                    {x: 8, y: 178}, {x: 6, y: 174}, {x: 4, y: 170}, {x: 2, y: 164}, 
                    {x: 1, y: 160}, {x: 0, y: 150}, {x: 1, y: 140}, {x: 2, y: 136}, 
                    {x: 4, y: 130}, {x: 6, y: 126}, {x: 8, y: 122}, {x: 10, y: 119}, 
                    {x: 15, y: 114}, {x: 20, y: 109}, {x: 25, y: 106}, {x: 30, y: 104}, 
                    {x: 35, y: 102}, {x: 40, y: 101}, {x: 45, y: 100}, {x: 50, y: 100}, 
                    {x: 55, y: 101}, {x: 60, y: 102}, {x: 65, y: 104}, {x: 70, y: 106}, 
                    {x: 75, y: 109}, {x: 80, y: 114}, {x: 85, y: 119}, {x: 90, y: 128}, 
                    {x: 92, y: 133}, {x: 94, y: 140}, {x: 94.9, y: 150}, {x: 95.9, y: 158}, 
                    {x: 96.9, y: 166}, {x: 97.9, y: 174}, {x: 98.9, y: 182}, {x: 100, y: 190}, 
                    {x: 99, y: 182}, {x: 98, y: 174}, {x: 97, y: 166}, {x: 96, y: 158}, 
                    {x: 95, y: 150}, {x: 94, y: 140}, {x: 93, y: 130}, {x: 92, y: 120}, 
                    {x: 91, y: 110}, {x: 90, y: 100}, {x: 89, y: 90}, {x: 88, y: 80}, 
                    {x: 87, y: 70}, {x: 86, y: 60}, {x: 85, y: 50}, {x: 84, y: 40}, 
                    {x: 83, y: 30}, {x: 82, y: 20}, {x: 81, y: 10}, {x: 80, y: 0}
                ],
                description: 'Draw 9 with exact coordinates',
                type: 'coordinates'
            }]
        }
    },
    
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    NUMBERS_SEQUENCE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    DEBUG_MODE: false
};

// Create alias for compatibility with shared components (Rainbow, Bear)
const CONFIG = {
    ...DRAW_CONFIG,
    BEAR_IMAGE_PATH: DRAW_CONFIG.BEAR_IMAGE_PATH,
    RAINBOW_PIECES: DRAW_CONFIG.RAINBOW_PIECES,
    RAINBOW_COLORS: DRAW_CONFIG.RAINBOW_COLORS
};
