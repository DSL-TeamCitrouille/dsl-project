# Variability & Scenarios

## 1. List of parameters of variability

| Parameter Name            | Type         | Domain                                       | CT / RT / UI | Default Value  | Constraint / Effect                        |
| ------------------------- | ------------ | -------------------------------------------- | ------------ | -------------- | ------------------------------------------ |
| **board_size**            | integer      | [4–20]                                       | CT           | 10             | Board size (NxN); modifies topology.       |
| **piece_color** (logical) | enum         | {white, black, red, blue}                    | CT           | {white, black} | Logical identifier of factions (players).  |
| **piece_quantity**        | integer      | [1–30]                                       | CT           | 20             | Number of pieces per faction.              |                  |
| **dice_faces**            | integer      | [2–12]                                       | CT           | 6              | Number of die faces.                       |
| **direction**             | enum         |    {diagonal, orthogonal, any} | CT    | diagonal  | Which direction(s) can the piece goes
| **first_player**          | enum / integer        | {white, black, 1, 2}                | CT           | 1              | Determines who starts.                     |
| **can_move_backward**     | boolean      | {true, false}                                | CT           | false          | Allows or forbids backward moves.          |
| **mandatory_capture**     | boolean      | {true, false}                                | CT           | true           | Capture is forced when possible.           |
| **message_capture**       | string       | any string    |   CT  | "Nomnomnom"   | Message displayed when capture occures
| **goal_type**             | enum         | {WinByCapture, WinBySolitaire, WinByForfeit} | CT           | WinByCapture   | Defines the win condition.                 |
| **ai_difficulty**         | enum         | {heuristic, greedy, random}                   | CT           | random             | Strength of the AI.                        |
| **light_squares_color**   | string (hex) | color                                        | UI           | #F0D9B5      | Color of light board squares.              |
| **dark_squares_color**    | string (hex) | color                                        | UI           | #B58863      | Color of dark board squares.               |
| **highlight_color**       | string (hex) | color                                        | UI           | #FFFF00      | Highlight color for legal moves.           |
| **show_legal_moves**      | boolean      | {true, false}                                | RT           | false          | Shows move hints.                          |
| **mode**                  | enum          | {pvp, pvl, pvb, bvb, lvl}                   | RT           | pvp            | Game mode : who vs who 
darkMode.
| **darkMode**              | boolean       | {true,false}                                | RT           | false          | Changes to dark style 


---

## 2. Presets (Typical CT Configurations)

### **Preset 1 — DamDamClassic**
- Board : 8×8 (size 8)
- Pieces : white/black, 12 each
- Promotion : enabled (canPromote: true)
- Dice : disabled
- First Player : white
- Rules : alternating turns, capture allowed but not mandatory (mandatoryCapture: false), no backward movement
- Goal : WinByCapture

**Effect :** Standard deterministic checkers.

---

### **Preset 2 — DamDamRoyal**
- Board : size 10
- Pieces : white/black, 20 each
- Promotion : activated
- Dice : activated, 6 faces, 1 dice
- First Player : white
- Rules : capture allowed but not mandatory, backward moves allowed
- Goal : WinByCapture

**Effect :** The result of the dice has influence on each round, adds randomness via dice rolls.

---

### **Preset 3 — DamDamLimited**
- Board : Size 8
- Pieces : white/black, 8 each
- Promotion : activated
- Dice : disabled
- First Player : white
- Rules : capture allowed but not mandatory, backward moves not allowed,
- Goal : WinByCapture

**Effect :** quick and easy version for beginners

---

### **Preset 4 — DamDamFastDark**
- Board : size 8
- Pieces : black, 12 per camp
- Promotion : activated
- Dice : disabled
- First Player : player 1
- Rules : capture allowed but not mandatory, backward movements not allowed
- Goal : WinByCapture

**Effect :** No visibility on where each pawn is makes it harder to play

---

### **Preset 5 — DamDamSolitaireLight**
- Board : size 6
- Pieces : single colour (black), 35 pawns
- Promotion : disabled
- Dice : disabled
- First Player : black
- Rules : Mandatory capture, backward movements allowed
- Goal : WinBySolitaire (removeOwn: true, movesLeft: 0)

**Effect :** Solo puzzle variant where the goal is to keep one piece.

---

### **Preset 6 — MyDamDam**
- Board : size 10
- Pieces : red/blue, 20 per camp
- Promotion : activated
- Dice : activated, 6 faces, 1 dice
- First Player : blue
- Rules : capture allowed but not mandatory
- Goal : WinByCapture

**Effect :** Same logic as Preset 2, it shows other parameters that can be changed

---

## 3. Usage Scenarios

### **Scenario 1 — Compile-time modification (Game Structure)**
A designer changes `board_size` from 10 to 8 and `piece_quantity` from 20 to 12.
→ The board is regenerated as 8x8.
→ Player start with 12 pieces instead of 20.
→ Initial placement is recalculated.

**Impact :** Structural change requiring regeneration/compilation

---

### **Scenario 2 — UI Modification (Visual Style)**
A user changes :
- `light_squares_color`: `#F0D9B5` → `#E8E8E8` (off-white)
- `dark_squares_color`: `#B58863` → `#2C3E50` (dark blue)
- `piece_sprites`: replace images with futuristic icons

→ Visual theme updates instantly.
→ Game rules and state remain untouched.
→ Aucun impact sur le déroulement de la partie en cours.

**Impact :** Changes are cosmetic only, no regeneration necessary.

---

### **Scenario 3 — Run-time adjustment (User experience)**
During gameplay, the player modifies :
- `animation_speed`: 3 → 5 (accelerates the animations)
- `show_legal_moves`: false → true (activates visual help)
- `ai_difficulty`: 2 → 4 (stronger AI)

→ The animations speed up immediatly.
→ Move hints appear.
→ AI gets stronger but slower (more calculations).
→ State of the game and rules don't change.

**Impact :** Real-time UX changes without altering game logic

---

### **Scenario 4 — Dice variation (Compile-time)**
The parameter `dice_enabled` switches from `false` to `true`, with `dice_faces: 6` and `dice_quantity: 1`.
→ Turns now include a dice roll before each round
→ The dice results may influence the movement.
→ Change of turn structure (turn = dice throw + movement).

**Impact :** Major rule change requiring a new variant.

---

## 4. Separation of Responsibilities

### **Compile-Time (CT) — Game Structure**
Defines the game's foundation :
- Board topology
- Piece set
- Movement/capture rules
- Win condition
- Dice mechanics

**Changing these parameters requires regeneration/compilation because it alter the core logic.**

### **UI/Skin — Visual Appearance**
Defines how the game looks :
- Board colors
- Rendering style
- Extra visual components

**Only appearance changes, doesn't alter the core logic.**

### **Run-Time (RT) — User Experience**
Defines how the game feels :
- Animation speed
- Visual aids (legal moves)
- Ai strength

**These parameters are adjustable during gameplay without affecting the rules or the state of the game.**

---

## 5. Color consistency

**Distinction importante :**

### Logical Color (CT - in `Pieces`)
```
piece Player1 {
    color white      // ← Logical player id
    quantity 12
}
```
This color is used internally to distinguish the players.

### Visual color (UI - in `Theme`)
```
ui {
    theme {
        lightSquares: "#F0D9B5"    // ← Board appearance
        darkSquares: "#B58863"
    }
}

---