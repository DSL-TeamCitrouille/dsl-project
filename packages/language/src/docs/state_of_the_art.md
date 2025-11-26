# Mapping of Existing Work and Originality

## References

### 1. GDL (Game Description Language) — DSL / Rules
- **Category:** DSL / Game rules  
- **Language/Runtime:** Logic programming (Prolog-like)  
- **License:** Open  
- **Game families:** Perfect-information board games  
- **Rule expressiveness:**
  - State: Yes  
  - Randomness: No (Yes in GDL-II with the `random` keyword)  
  - Hidden information: No (Yes in GDL-II with the `sees` keyword)  
- **Variability:** At compile-time (different game definitions)  
- **Interoperability:** Text protocol, Stanford GGP platform  
- **Maturity and activity:** Mature (since 2000), widely used in academic research  
- **URL:** http://games.stanford.edu/games/gdl.html

---

### 2. Ludii — DSL / Game System
- **Category:** DSL / Game system / AI framework  
- **Language/Runtime:** Java, ludeme-based language  
- **License:** Open source  
- **Game families:** Over 1000 traditional board games (draughts, chess, go, etc.)  
- **Rule expressiveness:**
  - State: Very complete  
  - Randomness: Yes  
  - Hidden information: Yes  
- **Variability:** High (compile-time via ludemes, run-time via parameters)  
- **Interoperability:** Ludii Game Logic Language (L-GDL), AI integration  
- **Maturity and activity:** Very active (since 2019), funded by the ERC Digital Ludeme project  
- **URL:** https://ludii.games/

---

### 3. Pygame / Python Game Libraries — Interface framework
- **Category:** User interface / Game framework  
- **Language/Runtime:** Python (multi-platform)  
- **License:** LGPL  
- **Game families:** 2D games (board games, arcade, platformers)  
- **Rule expressiveness:** Purely programmatic implementation  
- **Variability:** At runtime (in the code)  
- **Interoperability:** Python ecosystem, integrable with any other Python library  
- **Maturity and activity:** Very mature (20+ years), large community  
- **URL:** https://www.pygame.org/

---

### 4. UCI (Universal Chess Interface) — Protocol / Format
- **Category:** Protocol / Format  
- **Language/Runtime:** Text protocol (language-independent)  
- **License:** Open  
- **Game families:** Chess and variants  
- **Rule expressiveness:** Representation of positions and move communication  
- **Variability:** Engine-specific parameters via `setoption`  
- **Interoperability:** Standard protocol between engines and GUIs (over 300 compatible engines)  
- **Maturity and activity:** Very mature (since 2000), industrial standard  
- **URL:** https://www.chessprogramming.org/UCI

---

### 5. MCTS (Monte Carlo Tree Search) — AI Framework
- **Category:** AI / Search algorithm  
- **Language/Runtime:** Multiple implementations (Python, Java, C++)  
- **License:** Varies depending on implementations (often open source)  
- **Game families:** Board games with high branching factor (Go, Chess, Hex, etc.)  
- **Rule expressiveness:** Requires a game-state interface and move generation  
- **Variability:** Algorithm parameters (iterations, exploration constant)  
- **Interoperability:** Integrable into any game engine with a state/action API  
- **Maturity and activity:** Highly active research domain (since 2006), used in AlphaGo  
- **URL:** https://en.wikipedia.org/wiki/Monte_Carlo_tree_search

---

### 6. Python Arcade Library — Interface engine
- **Category:** User interface / Game engine  
- **Language/Runtime:** Python (OpenGL-based)  
- **License:** MIT  
- **Game families:** 2D games (arcade, platformers, board games)  
- **Rule expressiveness:** Programmatic implementation  
- **Variability:** At runtime via code parameters  
- **Interoperability:** Python ecosystem, sprite system, physics engine  
- **Maturity and activity:** Active (since the 2010s), well documented  
- **URL:** https://api.arcade.academy/

---

## Comparative Table

| Name | Category | Language/Runtime | Game families | Rule expressiveness (state / randomness / hidden info) | Variability (compile-time / run-time) | Interoperability (formats / protocols) | Maturity and activity | URL |
|------|------------|----------------|------------------|--------------------------------------------------------|----------------------------------------|------------------------------------------|------------------------|-----|
| **GDL** | DSL / Rules | Logic (Prolog-like) | Perfect-information board games | State: Yes, Randomness: No (Yes in GDL-II), Hidden info: No (Yes in GDL-II) | Compile-time | Text protocol, Stanford GGP | Mature (2000+), academic standard | http://games.stanford.edu |
| **Ludii** | DSL / System / AI | Java, L-GDL | 1000+ board games | State: Yes, Randomness: Yes, Hidden info: Yes | Compile-time and run-time | L-GDL, AI API, export | Very active (2019+), ERC funded | https://ludii.games |
| **Pygame** | Interface framework | Python | 2D games, board games | Programmatic implementation | Run-time | Python ecosystem | Very mature (20+ years) | https://pygame.org |
| **UCI** | Protocol | Text protocol | Chess variants | Position / moves only | Run-time (`setoption`) | Standard engine/interface protocol | Very mature (2000+), industry norm | https://chessprogramming.org/UCI |
| **MCTS** | AI algorithm | Multiple languages | High branching-factor games | Requires game interface | Run-time (algorithm parameters) | Game-agnostic API | Very active research (2006+) | https://en.wikipedia.org/wiki/MCTS |
| **Python Arcade** | Interface engine | Python | 2D games | Programmatic implementation | Run-time | Python, sprites, physics | Active (2010s+) | https://api.arcade.academy |

---

## Originality Note

### Does an external language exist that is very close to your idea?
Yes and no.  
Ludii is the closest conceptually, because it also models board games with variability.  
However, no existing DSL specifically combines:

- **Checkers-like games** as the primary domain  
- **Adding dice** as an element of randomness in a traditionally deterministic game  
- A **simple and readable syntax** inspired by **Langium**  
  (example: `direction diagonal`, `chaining captures true`)  
- **Explicit variability**, distinguishing compile-time parameters from run-time parameters  
- **Integration of services** (text mode, graphical mode, AI, complexity, LLM) from the design phase

---

## Differentiating Axes

1. **Focused and accessible domain**  
   The DSL specifically targets checkerboard-style games (checkers-type), making it simpler and more accessible than general systems like GDL or Ludii which aim to cover all game types.

2. **Gameplay innovation**  
   Adding dice to traditional checkers is a gameplay innovation. None of the surveyed DSLs proposes this combination of deterministic checkers + randomness.

3. **Modern and readable syntax**  
   Inspired by Langium, the syntax is clear and close to natural language, unlike the Prolog-like style of GDL or the complex structures of Ludii.

4. **Explicit variability**  
   A clear separation between the game structure (compile-time parameters) and dynamic settings (run-time parameters), which is not always explicit in other systems.

5. **Integrated services**  
   Designed from the start to support various modes and services: text mode, graphical interface, AI, complexity analysis, and LLM integration, while other systems evolved toward these features more gradually.
