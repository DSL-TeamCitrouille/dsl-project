# AI Agents in Dam-Dam 


Dam-Dam includes several automated AI bots with different levels of intelligence. 
Each bot uses the same game engine but applies a different decision logic.


---


## Random Bot 


### Strengths
- Extremely fast and lightweight.
- Useful for testing UI, move legality, and baseline behavior.
- Provides a simple opponent for debugging.


### Weaknesses
- No strategy, selects a random legal move.
- Cannot defend, attack, or anticipate threats.
- Very weak against any intelligent player.


### Known Failure Modes
- Moves into squares where it can be immediately captured.
- Can get stuck in between meaningless moves.
- May sacrifice high-value piece (queen) without purpose.


---


## Greedy Bot 


### Strengths
- Prioritizes immediate tactical gains.
- Scoring rewards:
  - Capturing pieces (highest weight).
  - Capturing queens.
  - Advancing forward.
  - Promotion opportunities.
  - Central board control.
- Much stronger than Random with minimal computational cost.




### Weaknesses
- Only evaluates the current move (no long term strategy).
- Might choose risky captures that lose material on the next turn.
- Blind to long-term positional weaknesses.




### Known Failure Modes
- Chooses a capture that leads to a guaranteed counter-capture.
- Breaks defensive structure to chase small advantages.
- Misjudges diagonal queen threats or multi-step consequences.


---


## Heuristic Bot 


### Strengths
- Evaluates the resulting board after each legal move.
- Uses a combination of heuristics:
  - Material balance
  - Positional advantage
  - Central control
  - Capture value
  - Promotion value
  - Back-rank defense
- Produces more stable and consistent play compared to Greedy.




### Weaknesses
- Still limited to evaluation of the current board.
- Sensitive to heuristic weight tuning.
- Cannot detect forced tactical sequences unless encoded manually.




### Known Failure Modes
- Avoids good aggressive moves due to conservative scoring.
- Cannot anticipate multi-turn traps.
- Occasionally overvalues central squares relative to tactical threats.


---


## LLM Bot (Large Language Model) 


### Strengths
- Can reason conceptually about strategy, safety, and long-term planning.
- Adapts to different rule sets through the prompt without code changes.
- Often plays in a human-like and flexible way.
- Creativity and stability can be tuned using temperature.


### Weaknesses
- Much slower than built-in bots due to API request latency.
- Output must be valid JSON and legal and errors require repair logic.
- Quality and reproducibility depend on model, temperature, and provider.


### Known Failure Modes
- Returns invalid JSON (missing fields, malformed syntax).
- If repair attempts fail, the backend forces a fallback move.
- Occasionally chooses strategically bad or overly passive moves.
- Gets blocked in a cache board state

