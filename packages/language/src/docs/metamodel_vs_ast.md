# Comparison Metamodel vs TypeScript AST

## 1. Mapping Table

### Main Concepts

| Metamodel (PlantUML) | Langium AST (Grammar) | Relation Type | Comments |
|----------------------|------------------------|----------------|----------|
| **Game** | **Damier** | Renaming | Better domain representation |
| Game.name | Damier.name | Direct |
| Game.demarrer() | Not present | Removal | Methods are not part of the AST (runtime logic implemented elsewhere) |
| Game.verifierVictoire() | Not present | Removal | To be implemented elsewhere as well |

### Game Structure (Compile-time)

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|------|----------|
| **Damier** | **Board** | Renaming | Former *Damier* renamed to *Board* in the grammar |
| Damier.tailleX, tailleY | Board.size (INT) | Merge | Adds constraint of a square board |
| Damier.cases[][] | Not present | Removal | Structure generated dynamically at runtime |
| Case | Not present | Removal | Cases created at execution time, not in the AST |
| Case.x, y, pion | Not present | Removal | Game state, not structure |

### Pieces and Players

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|-------|----------|
| **Pion** | **Piece** | Renaming | English term adopted |
| Pion.couleur | Piece.color | Direct | Direct mapping |
| Pion.position | Not present | Removal | Position = runtime state |
| Player | Not present | Addition | Players are implicit through colors in rules |
| Player.id, couleur, nbJetons | Piece.color, quantity | Partial merge | Quantity in Piece, identification via color |
| Couleur (enum) | ID (terminal) | Transformation | Flexible — accepts any identifier as a color |

### Rules and Movements

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|-------|----------|
| **Rule** (when/then) | **Rules** { rule[] } | Restructuring | Declarative approach with specific rule types |
| Rule.when, then | Not present | Removal | Replaced by specialized rules |
| Move | MoveRule | Specialization | More structured and specific |
| Not present | CaptureRule | Addition | Explicit separation of capture vs movement |
| Not present | ActionRule | Addition | Clear distinction of action types |
| Move.description | MoveRule (properties) | Decomposition | More granular structure (direction, alternating, etc.) |

### Objectives

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|-------|----------|
| **Goal** | **Objective** { goal[] } | Renaming | More formal terminology |
| Goal.kind, description | WinByCapture / WinBySolitaire / WinByForfeit | Specialization | Explicit objective types instead of a generic "kind" field |
| Not present | WinByCapture.target | Addition | Specifies which piece must be captured |
| Not present | WinBySolitaire.removeOwn, movesLeft | Addition | Parameters specific to solitaire-type goals |

### State and Randomization

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|-------|----------|
| **State** | Not present | Removal | Runtime state, not part of the game definition |
| State.tourActuel, nbTours | Not present | Removal | Managed by the game engine |
| Randomness | Dice (optional) | Renaming | More specific — dice instead of generic randomness |
| Randomness.source | Dice.faces | Transformation | Number of faces instead of textual description |
| Randomness.lancerDe() | Not present | Removal | Runtime method |

### UI and Parameters

| Metamodel | Langium AST | Type | Comments |
|-----------|-------------|-------|----------|
| **Parameter** (compile/run) | Split UI / Settings | Major restructuring | Clear distinction between compile-time and runtime options |
| Parameter.kind | Implicit (UI=skin, Settings=runtime) | Transformation | Architectural distinction instead of a metadata flag |
| Not present | Theme (lightSquares, darkSquares, highlight) | Addition | Detailed visual customization |
| Not present | Sprites | Addition | Support for custom sprite assets |
| Not present | Layout (showCaptured) | Addition | Display options |
| Not present | Settings (animationSpeed, showLegalMoves, aiDifficulty) | Addition | Detailed UX settings |
| Preset | Not present | Removal | Presets handled through separate `.damdam` files |

---

## 2. Trade-offs and Justifications

### Merges

1. **Damier.tailleX/Y → Board.size**
   - **Why**: Grammar targets square board games (8×8, 10×10)
   - **Impact**: Simplifies syntax but restricts to square boards
   - **Alternative considered**: Keep width/height for rectangular boards

2. **Player + Pion → Piece with quantity**
   - **Why**: In declarative DSLs, you define piece types (e.g., "12 black pawns")
   - **Impact**: Player instances are created at runtime
   - **Advantage**: Closer to how board games are described ("the game has 12 white pawns")

### Renamings

1. **Game → Damier**
   - **Why**: Stronger alignment with the domain (board games)
   - **Impact**: More explicit but less generic

2. **Pion → Piece**
   - **Why**: English naming convention, interoperability
   - **Impact**: Consistency with international codebases

3. **Goal → Objective / specialized goal types**
   - **Why**: More clarity and specialization
   - **Impact**: More expressive AST with distinct types

### Removals

1. **Case, Position, State**
   - **Why**: These are **runtime** structures, not part of game definition
   - **Impact**: AST remains focused on **declarative definition**
   - **Justification**: Clear separation between definition (DSL) and execution (engine)

2. **Methods (demarrer, verifierVictoire, lancerDe)**
   - **Why**: AST encodes **data**, not behavior
   - **Impact**: Methods will be implemented in interpreter/compiler
   - **Justification**: MDE principle — metamodel describes, generator implements

3. **Preset**
   - **Why**: Can be handled through multiple `.damdam` files (e.g., `checkers.damdam`, `chess-variant.damdam`)
   - **Impact**: Simplifies grammar and improves modularity
   - **Alternative**: DSL-level imports

### Additions

1. **UI / Settings with detailed substructures**
   - **Why**: Required by grammar comments (COMPILE-TIME vs RUN-TIME)
   - **Impact**: Enables fine-grained configuration of appearance and experience
   - **Value**: Makes the DSL suitable for full playable games, not just rules

2. **Rule specialization (MoveRule, CaptureRule, ActionRule)**
   - **Why**: When/then rules were too generic
   - **Impact**: More strongly typed AST, better validation
   - **Value**: Compile-time error detection instead of runtime surprises

3. **Goal specialization (WinByCapture, etc.)**
   - **Why**: Replaces a generic `kind: String`
   - **Impact**: Better IDE completion and stricter validation
   - **Value**: Improved developer experience

### Major Transformations

1. **Parameter.kind → UI/Settings architecture**
   - **Before**: Flat list of parameters with compile/run flag
   - **After**: Clear hierarchical structure (Board/Pieces = compile, Settings = run, UI = skin)
   - **Justification**: Better separation of concerns, more maintainable

2. **Color enum → ID terminal**
   - **Before**: Fixed enum (WHITE/BLACK)
   - **After**: Free identifiers (e.g., "red", "blue", "green")
   - **Justification**: Flexibility for multi-player or themed games
