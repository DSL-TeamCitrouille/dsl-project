# Unsupported Features and Limitations

## 1. Current Limitations

### 1.1 Dice Mechanics
- **Single Dice Only**: The current implementation only supports one dice per game. Multiple dice rolls or dice pools are not supported.
- **No Conditional Dice Usage**: The dice must be rolled every turn when enabled. There is no support for optional or conditional dice rolls based on game state.

### 1.2 Board Constraints
- **Square Boards Only**: Only NxN square boards are supported. Rectangular boards (MxN where M≠N) are not possible.
- **Fixed Topology**: The board is always a flat grid.
- **No Custom Starting Positions**: Piece placement follows predetermined patterns. Custom initial configurations are not supported through the DSL.

### 1.3 Player and Piece Limitations
- **Maximum Two Players**: The game engine only supports 1-2 players. Multi-player games (3+ players) are not supported.
- **Homogeneous Pieces**: All pieces of the same color are identical and follow the same movement rules. Differentiated piece types (like chess pieces) are not supported.
- **No Piece Attributes**: Pieces cannot have custom attributes (health points, attack strength, special abilities).
- **Single Promotion Type**: Pieces can only promote to "Queen" status. Multiple promotion types or custom promotion rules are not supported.

### 1.4 Movement and Capture Restrictions
- **No Partial Moves**: When using dice, all moves must be used. Forfeiting remaining moves is not possible.
- **Simple Capture Logic**: Only basic capture-by-jumping is supported. En passant, ranged captures, or area-of-effect captures are not available.
- **No Move History**: The game doesn't track move history, preventing features like "undo" or replay functionality.
- **No Conditional Movement**: Movement rules cannot depend on game state (e.g., "can move 2 squares if no pieces captured").

### 1.5 Win Conditions
- **Limited Goal Types**: Only three win conditions are supported: WinByCapture, WinBySolitaire, and WinByForfeit.
- **No Score-Based Victory**: Point accumulation systems are not supported.
- **No Time Limits**: Timed games or turn time limits are not available.

### 1.6 AI and Automation
- **Limited AI Strategies**: Only three bot difficulty levels (random, greedy, heuristic) are available. No deep learning or advanced AI.
- **No AI Customization**: Bot behavior cannot be tuned through the DSL (e.g., aggression level, defensive play).
- **LLM Dependency**: The LLM mode requires an external backend server. Offline LLM play is not supported.
- **No AI vs AI Analysis**: Bot vs Bot games don't provide analytics, statistics, or learning capabilities.

### 1.7 UI and Visualization
- **Fixed UI Layout**: The board and controls have a fixed layout. Custom layouts are not supported.
- **Limited Theme Customization**: Only board square colors can be customized. Piece appearance, fonts, and other UI elements are hardcoded.
- **No Animation Control**: Animation speeds and styles cannot be configured through the DSL.
- **Browser-Only**: The generated game only works in web browsers. Native desktop or mobile apps are not supported.

### 1.8 Multiplayer and Networking
- **No Online Multiplayer**: Only local play is supported. Network play against remote opponents is not available.
- **No Game Persistence**: Games cannot be saved and resumed later. Browser refresh loses the game state.
- **No Spectator Mode**: Third-party observation of ongoing games is not supported.
- **No Chat or Communication**: Players cannot communicate through the interface.

### 1.9 Data and Analytics
- **No Game Recording**: Completed games cannot be saved or exported.
- **No Statistics Tracking**: Win rates, average game length, and other metrics are not tracked.
- **No Replay System**: Games cannot be replayed or analyzed after completion.
- **No Export Formats**: Game state cannot be exported to standard formats (PGN, JSON, etc.).

## 2. Technical Constraints

### 2.1 Performance
- **Large Board Performance**: Boards larger than 20x20 may experience performance degradation, especially with high piece counts.
- **Bot Computation Time**: Heuristic bots may take noticeable time on larger boards, with no progress indication.
- **Browser Storage**: The persistent storage API has size limitations (5MB per key) that may constrain game state.

### 2.2 Code Generation
- **Single File Output**: The bundled HTML generator produces one large file. Modular output is not supported.
- **No Incremental Compilation**: Any DSL change requires full regeneration of the HTML file.
- **Limited Error Messages**: Compilation errors may not always provide clear guidance on how to fix issues.

### 2.3 Browser Compatibility
- **Modern Browsers Only**: The generated code requires ES6+ features. Legacy browser support is absent.
- **No Mobile Optimization**: The UI is not optimized for touch controls or small screens.
- **localStorage Restrictions**: The system cannot use browser storage, limiting certain features.

## 3. DSL Language Limitations

### 3.1 Expressiveness
- **No Conditional Logic**: The DSL cannot express conditional rules (e.g., "if dice roll is 6, roll again").
- **No Variables or State**: Game-specific variables or counters cannot be defined.
- **No Custom Functions**: Users cannot define custom game logic or callbacks.
- **No Inheritance**: Piece types cannot inherit properties from other pieces.

### 3.2 Validation
- **Weak Compile-Time Validation**: Many invalid configurations are only caught at runtime.
- **No Constraint Checking**: Contradictory rules (e.g., mandatory capture + solitaire mode) are not prevented.
- **Limited Type Safety**: String-based references (colors, piece names) are not validated until runtime.

### 3.3 Extensibility
- **Closed Architecture**: Adding new movement types or rules requires modifying the core generator code.
- **No Plugin System**: Third-party extensions or custom rules cannot be added without forking the project.
- **Hardcoded Constants**: Many game parameters (animation speeds, UI dimensions) are hardcoded and not exposed through the DSL.