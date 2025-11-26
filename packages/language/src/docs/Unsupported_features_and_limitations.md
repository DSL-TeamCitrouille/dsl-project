# Unsupported Features / Limitations

This DSL is intentionally simple and focused on defining checkered board games.  
As a result, several features are not supported or are only partially covered.

---

## 1. Board Structure Limitations
- **Only square boards are supported.**  
  Rectangular boards (e.g., 8×10) cannot be expressed.
- **No explicit board tiles (cells).**  
  Individual squares, coordinates, or per-cell attributes cannot be defined in the DSL.

---

## 2. No Runtime Game State Modeling
- Piece **position**, turn counters, history, captured lists, and dynamic state are **not part of the DSL**.  
  These must be handled by the interpreter or the game engine.
- No support for:
  - Move history
  - Undo/redo semantics
  - Per-piece state (e.g., “promoted”, “kinged”)

---

## 3. Limited Rule Expressiveness
- No generic **condition → action** logic (no when/then rules).  
  Only the predefined rule types are allowed:  
  `movement`, `capture`, `action`.
- **Movement constraints are basic:**  
  no step count, no jump specification, no direction per color.
- **Capture rules lack geometry**, e.g. diagonal jump specifics, mandatory multi-jumps behavior.
- No ability to describe:
  - complex move patterns,
  - custom piece abilities,
  - promotion rules,
  - chained non-capture movement restrictions.

---

## 4. Limited Objectives
- Only three victory types exist:  
  `winByCapture`, `winBySolitaire`, `winByForfeit`.
- No support for:
  - points / scoring systems,
  - time-based victory,
  - area control objectives,
  - multi-player standings.

---

## 5. No Multi-Player Support
- Only **two-player** games or **solitaire** mode are implicitly supported.  
- The DSL has no notion of more than two colors interacting competitively.

---

## 6. No Randomness Beyond a Single Die
- Only **one dice block** is allowed.
- No:
  - multiple dice,
  - weighted dice,
  - custom probability tables,
  - random events or triggers.

---

## 7. UI and Settings Are Limited
- UI only controls colors and simple layout toggles.  
  No support for:
  - sprite animations,
  - sound,
  - accessibility options,
  - window or camera configuration.
- Settings are minimal and not validated (e.g., `animationSpeed`, `aiDifficulty`).

---

## 8. No Modularity or Imports
- A DamDam file cannot import or extend another file.  
- No reusable rule sets, no inheritance, no parameterized game templates.

---

## 9. No Semantic Validation of Many Fields
- The DSL does not validate whether:
  - colors actually correspond to pieces,
  - objectives reference existing pieces,
  - the first player exists,
  - dice faces are consistent with rules.

---

## 10. Not Suitable for Non-Board Games
- The DSL cannot describe:
  - card games,
  - gridless games,
  - 3D board games,
  - hexagonal or irregular boards.
