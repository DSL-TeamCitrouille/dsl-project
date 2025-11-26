"""
Production-Grade LLM Backend Service for Board Game AI

This service provides intelligent move suggestions using LLM.
Sends complete game state (all pieces with IDs, positions, etc.) and full rules
to the LLM, which returns the best legal move.

Features:
- Complete game state serialization
- Detailed rule explanation
- Move parsing and validation
- Logging and error handling
- Cost tracking
- Response caching
- Rate limiting
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import hashlib
import json
import re

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('llm_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Setup rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configuration
API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-3.5-sonnet" #"openai/gpt-4.1" #"anthropic/claude-3-haiku"
DEFAULT_TEMPERATURE = 0.7

# Token costs (OpenRouter pricing)
TOKEN_COSTS = {
    "openai/gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "openai/gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "anthropic/claude-3-haiku": {"input": 0.00025, "output": 0.00125},
}

# Response cache
response_cache = {}
request_stats = {
    "total_requests": 0,
    "total_tokens": 0,
    "total_cost": 0.0,
    "cache_hits": 0,
    "cache_misses": 0
}


def validate_api_key():
    """Validate OpenRouter API key is configured"""
    if not API_KEY:
        logger.error("API key not configured")
        return False, "OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env"
    return True, None


def serialize_game_state(game_state: dict) -> str:
    """
    Serialize game state into a readable format for the LLM
    
    Args:
        game_state: Dict containing board_size, pieces, current_player, rules, etc.
    
    Returns:
        Formatted string describing the game state
    """
    board_size = game_state.get("board_size", 8)
    pieces = game_state.get("pieces", [])
    current_player = game_state.get("current_player", 0)
    direction = game_state.get("direction", "diagonal")
    mandatory_capture = game_state.get("mandatory_capture", False)
    legal_moves = game_state.get("legal_moves", [])
    
    # Build piece list grouped by player
    player_pieces = {}
    for piece in pieces:
        player = piece["player"]
        if player not in player_pieces:
            player_pieces[player] = []
        player_pieces[player].append(piece)
    
    # Create formatted output
    output = f"""
╔═══════════════════════════════════════════════════════════╗
║                    GAME STATE ANALYSIS                    ║
╚═══════════════════════════════════════════════════════════╝

BOARD INFORMATION:
  - Board Size: {board_size}x{board_size}
  - Direction Mode: {direction}
  - Current Turn: Player {current_player}
  - Mandatory Capture: {'Yes' if mandatory_capture else 'No'}

PIECES ON BOARD:
"""
    
    # Add piece information
    for player_id, player_pieces_list in sorted(player_pieces.items()):
        output += f"\n  Player {player_id}:\n"
        for piece in player_pieces_list:
            piece_type = "QUEEN" if piece.get("isQueen") else "regular"
            output += f"    - ID: {piece['id']:4} | Position: ({piece['row']}, {piece['col']:2}) | Type: {piece_type} | Color: {piece['color']}\n"
    
    # Add legal moves information
    output += f"\n\nLEGAL MOVES AVAILABLE: {len(legal_moves)} moves\n"
    
    if legal_moves:
        # Group moves by piece
        moves_by_piece = {}
        for move in legal_moves:
            from_pos = move.get("from", {})
            to_pos = move.get("to", {})
            from_key = f"({from_pos.get('row')},{from_pos.get('col')})"
            
            if from_key not in moves_by_piece:
                moves_by_piece[from_key] = []
            
            # Find piece ID for this position
            piece_id = None
            for piece in pieces:
                if piece['row'] == from_pos.get('row') and piece['col'] == from_pos.get('col'):
                    piece_id = piece['id']
                    break
            
            capture_info = ""
            if move.get("capturedIds"):
                capture_info = f" [CAPTURES {len(move['capturedIds'])} piece(s)]"
            
            moves_by_piece[from_key].append({
                "piece_id": piece_id,
                "from": from_key,
                "to": f"({to_pos.get('row')},{to_pos.get('col')})",
                "captures": capture_info
            })
        
        # Print moves organized by piece
        for from_pos, moves in sorted(moves_by_piece.items()):
            for i, move in enumerate(moves):
                piece_info = f" (Piece: {move['piece_id']})" if move['piece_id'] else ""
                output += f"  Move {i+1}: {move['from']} → {move['to']}{move['captures']}{piece_info}\n"
    
    output += "\n"
    return output


def build_llm_prompt(game_state: dict) -> str:
    """
    Build a comprehensive prompt for the LLM with game state and rules
    
    Args:
        game_state: Complete game state dictionary
    
    Returns:
        Full prompt string to send to LLM
    """
    direction = game_state.get("direction", "diagonal")
    board_size = game_state.get("board_size", 8)
    mandatory_capture = game_state.get("mandatory_capture", False)
    
    # Determine direction explanation
    direction_rules = {
        "diagonal": "Pieces move diagonally. Regular pieces move forward diagonally only. Queens move any number of squares diagonally.",
        "orthogonal": "Pieces move horizontally or vertically. Regular pieces move forward and sideways only. Queens move any direction.",
        "any": "Pieces can move in any direction (forward, backward, sideways, diagonally). Queens can move multiple squares."
    }
    
    direction_text = direction_rules.get(direction, "Diagonal movement")
    
    # Serialize game state
    game_state_text = serialize_game_state(game_state)
    
    # Build the complete prompt
    prompt = f"""You are an intelligent game AI player. Analyze the current board state and suggest the BEST legal move.

═══════════════════════════════════════════════════════════════════════════════
GAME RULES
═══════════════════════════════════════════════════════════════════════════════

MOVEMENT:
  {direction_text}

CAPTURE:
  - A piece can capture an opponent's piece by jumping over it to an empty square
  - After capturing, the piece lands on the opposite side of the captured piece
  - Multiple captures in sequence are allowed (chain captures)
  - Captured pieces are removed from the board immediately

PROMOTION:
  - Regular pieces become QUEENS when reaching the opposite end of the board
  - Queens have more movement capabilities (see direction rules above)

VICTORY:
  - Eliminate all opponent pieces to win
  - If you have no legal moves, you lose

SPECIAL RULES:
  - Mandatory Capture: {'If enabled, you MUST capture if possible' if mandatory_capture else 'Captures are optional'}
  - Board Size: {board_size}x{board_size}
  - Pieces are uniquely identified by their ID (p0, p1, p2, etc.)

═══════════════════════════════════════════════════════════════════════════════
{game_state_text}
═══════════════════════════════════════════════════════════════════════════════
STRATEGY CONSIDERATIONS:
═══════════════════════════════════════════════════════════════════════════════

First and foremost, prioritize the SAFETY of your pieces. Consider the following factors in order of importance:

1. PIECE SAFETY ( MOST IMPORTANT): AVOID LOSING PIECES. Avoid moves that expose pieces to capture. The opponent can see your pieces and will try to capture them
2. OPONNENT MOVES: Consider how the opponent might respond to your move and try to block their strategies
3. POSITION: Keep pieces coordinated and supporting each other
4. CONTROL: Try to control the center of the board
5. ADVANCEMENT: Move toward opponent's side ONLY when safe
6. CAPTURE OPPORTUNITIES: Take opponent pieces when possible
8. CHAIN CAPTURES: Look for opportunities to make multiple captures in one turn

You must consider all these factors when choosing your move. And keep the goal of the game in mind. Do not just focus on capturing pieces, but also on protecting your own pieces and maintaining a strong position on the board.
Connsider all pieces on the board, both yours and your opponent's, when analyzing the situation.
Do not focus on just one piece or one area of the board. Do not focus on advancing a single piece at the expense of overall strategy.
═══════════════════════════════════════════════════════════════════════════════
GOAL OF THE GAME (IMPORTANT):
═══════════════════════════════════════════════════════════════════════════════

You are playing to WIN the game. You MUST focus on protecting your pieces.
The player who captures all opponent pieces first without loosing its own pieces wins the game.
To win you must focus on both offense (capturing opponent pieces) and defense (protecting your own pieces from being captured).
Always think several moves ahead to outmaneuver your opponent.

═══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT (IMPORTANT)
═══════════════════════════════════════════════════════════════════════════════
Analyze the board and provide your best move:

Return EXACTLY one JSON object in ONE LINE.
No extra text. No explanation. No markdown. No comments.

Use this schema:

{{"piece_id": "<id>", "target": {{"row": <row>, "col": <col>}}, "reasoning": "<short_reason>"}}

Example (one-line only):

{{"piece_id": "p4", "target": {{"row": 3, "col": 4}}, "reasoning": "Safe advancement"}}

Your answer MUST be:
- valid JSON
- one line only
- no text before or after
- no trailing commas
- no backticks


═══════════════════════════════════════════════════════════════════════════════

Now, analyze the current board state and provide your best move following the format above exactly.
"""
    
    return prompt

def build_repair_prompt(original_prompt: str, bad_response: str, legal_moves: list) -> str:
    """
    Build a repair prompt when the LLM returned invalid JSON or an illegal move.
    We reuse the original prompt (rules + game state) to keep full context.
    """
    legal_moves_json = json.dumps(legal_moves, ensure_ascii=False)

    return (
        f"{original_prompt}\n\n"
        "⚠️ The answer you gave previously was INVALID (wrong JSON format or illegal move).\n\n"
        f"Here is your INVALID answer:\n{bad_response}\n\n"
        "Here is the list of ALL LEGAL MOVES you are allowed to choose from:\n"
        f"{legal_moves_json}\n\n"
        "You must now FIX your previous answer.\n\n"
        "STRICT INSTRUCTIONS:\n"
        "- Return EXACTLY ONE line of VALID JSON.\n"
        "- NO text before the JSON.\n"
        "- NO text after the JSON.\n"
        "- NO markdown, NO commentary, NO explanation.\n"
        "- The move MUST be one of the legal moves listed above.\n\n"
        "VALID JSON FORMAT:\n"
        '{{"piece_id":"<id>","target":{{"row":<row>,"col":<col>}},"reasoning":"<short_reason>"}}'
    )

def is_legal(parsed_move: dict | None, game_state: dict) -> bool:
    """
    Check if the parsed move corresponds to one of the legal_moves
    in the game_state.

    parsed_move format:
      {
        "piece_id": "p8",
        "target": {"row": 2, "col": 1},
        "reasoning": "..."
      }

    legal_moves format (from frontend):
      {
        "from": {"row": 1, "col": 3},
        "to": {"row": 2, "col": 1},
        "capturedIds": [...]
      }
    """
    if not parsed_move:
        return False

    pieces = game_state.get("pieces", [])
    legal_moves = game_state.get("legal_moves", [])

    piece_id = parsed_move.get("piece_id")
    target = parsed_move.get("target") or {}

    if not piece_id or "row" not in target or "col" not in target:
        return False

    # Find piece position
    piece = next((p for p in pieces if p.get("id") == piece_id), None)
    if not piece:
        return False

    from_row, from_col = piece.get("row"), piece.get("col")
    to_row, to_col = target.get("row"), target.get("col")

    # Compare against legal_moves
    for mv in legal_moves:
        frm = mv.get("from", {})
        to = mv.get("to", {})
        if (
            frm.get("row") == from_row and
            frm.get("col") == from_col and
            to.get("row") == to_row and
            to.get("col") == to_col
        ):
            return True

    return False

def parse_llm_response(response_text: str, pieces: list):
    try:
        data = json.loads(response_text.strip())
    except json.JSONDecodeError:
        logger.error(f"LLM did not return valid JSON: {response_text}")
        return None

    # Validate fields
    piece_id = data.get("piece_id")
    if piece_id not in [p["id"] for p in pieces]:
        return None

    target = data.get("target", {})
    reasoning = data.get("reasoning", "")

    return {
        "piece_id": piece_id,
        "target": {
            "row": int(target.get("row")),
            "col": int(target.get("col"))
        },
        "reasoning": reasoning
    }


def hash_game_state(game_state: dict) -> str:
    """
    Create a stable, deterministic hash of the game state.
    Only include fields that define the board position.
    """

    # Normalize pieces (sorted by id)
    pieces = sorted(
        [
            {
                "id": p["id"],
                "player": p["player"],
                "row": p["row"],
                "col": p["col"],
                "isQueen": bool(p.get("isQueen", False))
            }
            for p in game_state.get("pieces", [])
        ],
        key=lambda x: x["id"]
    )

    # Normalize legal moves (sorted)
    legal_moves = sorted(
        [
            {
                "from": (m["from"]["row"], m["from"]["col"]),
                "to": (m["to"]["row"], m["to"]["col"])
            }
            for m in game_state.get("legal_moves", [])
        ],
        key=lambda x: (x["from"], x["to"])
    )

    clean_state = {
        "pieces": pieces,
        "legal_moves": legal_moves,
        "current_player": game_state.get("current_player"),
        "turn": game_state.get("turn", 0)
    }

    state_json = json.dumps(clean_state, sort_keys=True)
    return hashlib.md5(state_json.encode()).hexdigest()




def call_openrouter(prompt: str, model: str = DEFAULT_MODEL, temperature: float = DEFAULT_TEMPERATURE):
    """
    Call OpenRouter API to get LLM response
    
    Args:
        prompt: Complete prompt with game state and rules
        model: LLM model to use
        temperature: Response temperature (creativity level)
    
    Returns:
        Tuple of (response_text, token_count, cost) or (None, 0, 0.0) on error
    """
    try:
        logger.info(f"Calling OpenRouter API with model: {model}")
        
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("HTTP_REFERER", "http://localhost"),
                "X-Title": "Game AI",
            },
            json={
                "model": model,
                "temperature": temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            },
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            message_content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Extract token usage
            usage = result.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            total_tokens = input_tokens + output_tokens
            
            # Calculate cost
            costs = TOKEN_COSTS.get(model, {"input": 0.0, "output": 0.0})
            input_cost = (input_tokens / 1000) * costs["input"]
            output_cost = (output_tokens / 1000) * costs["output"]
            total_cost = input_cost + output_cost
            
            logger.info(f"OpenRouter response: {total_tokens} tokens, ${total_cost:.6f}")
            
            return message_content, total_tokens, total_cost
        else:
            error_msg = f"OpenRouter API error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            return None, 0, 0.0

    except requests.Timeout:
        logger.error("OpenRouter API request timeout")
        return None, 0, 0.0
    except requests.RequestException as e:
        logger.error(f"OpenRouter API request failed: {str(e)}")
        return None, 0, 0.0
    except ValueError as e:
        logger.error(f"Failed to parse OpenRouter response: {str(e)}")
        return None, 0, 0.0


@app.route("/api/move", methods=["POST"])
@limiter.exempt
def get_best_move():
    """
    Main endpoint to get the best move for the current game state
    
    Expected JSON body:
    {
        "board_size": 8,
        "direction": "diagonal",
        "current_player": 0,
        "mandatory_capture": false,
        "pieces": [
            {"id": "p0", "player": 0, "row": 1, "col": 1, "color": "white", "isQueen": false},
            {"id": "p1", "player": 0, "row": 1, "col": 3, "color": "white", "isQueen": false},
            ...
        ],
        "legal_moves": [
            {"from": {"row": 1, "col": 1}, "to": {"row": 2, "col": 2}},
            ...
        ],
        "model": "openai/gpt-4o-mini" (optional),
        "temperature": 0.7 (optional)
    }
    
    Returns JSON:
    {
        "success": true/false,
        "piece_id": "p0",
        "target": {"row": 3, "col": 4},
        "reasoning": "Strategic explanation",
        "model": "model used",
        "tokens_used": number,
        "cost": "$0.0003",
        "cached": true/false
    }
    """
    request_stats["total_requests"] += 1
    
    try:
        # Validate API key
        is_valid, error = validate_api_key()
        if not is_valid:
            logger.error(f"API validation failed: {error}")
            return jsonify({"error": error, "success": False}), 500

        # Get request data
        data = request.get_json()
        if not data:
            logger.error("No JSON data in request")
            return jsonify({"error": "No JSON data provided", "success": False}), 400

        # Validate required fields
        required_fields = ["board_size", "current_player", "pieces", "legal_moves"]
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}", "success": False}), 400

        # Get optional parameters
        model = data.get("model", DEFAULT_MODEL)
        temperature = data.get("temperature", DEFAULT_TEMPERATURE)
        
        # Validate model
        if model not in TOKEN_COSTS:
            logger.warning(f"Unknown model requested: {model}, using default")
            model = DEFAULT_MODEL

        logger.info(f"Request #{request_stats['total_requests']}: player={data.get('current_player')}, "
                   f"pieces={len(data.get('pieces', []))}, moves={len(data.get('legal_moves', []))}")

        # Build prompt with complete game state and rules
        prompt = build_llm_prompt(data)
        
        # Check cache
        state_hash = hash_game_state(data)
        if state_hash in response_cache:
            logger.info(f"Cache hit for game state")
            cached_response = response_cache[state_hash]
            request_stats["cache_hits"] += 1
            
            return jsonify({
                "success": True,
                "piece_id": cached_response["piece_id"],
                "target": cached_response["target"],
                "reasoning": cached_response["reasoning"],
                "model": model,
                "tokens_used": 0,
                "cost": "$0.00",
                "cached": True,
                "request_number": request_stats["total_requests"]
            }), 200

        request_stats["cache_misses"] += 1

        # Call OpenRouter API
        response_text, tokens_used, cost = call_openrouter(prompt, model, temperature)

        if response_text is None:
            logger.error("Failed to get response from LLM")
            return jsonify({"error": "Failed to get response from LLM", "success": False}), 500

        # Parse response
        parsed_move = parse_llm_response(response_text, data.get("pieces", []))

        if parsed_move is None or not is_legal(parsed_move, data):
            logger.warning("Invalid JSON or illegal move. Trying repair once...")

            repair_prompt = build_repair_prompt(
                prompt,                         # original_prompt
                response_text,                  # bad_response
                data.get("legal_moves", [])     # legal_moves
            )

            repaired_text, tokens_used_repair, cost_repair = call_openrouter(
                repair_prompt, model, temperature
            )

            parsed_repair = parse_llm_response(repaired_text, data.get("pieces", []))

            if parsed_repair is None or not is_legal(parsed_repair, data):
                logger.error("Repair failed — LLM loses the turn")
                return jsonify({
                    "success": False,
                    "error": "LLM failed to return a valid legal move twice. Turn lost.",
                    "raw_first": response_text[:200],
                    "raw_repair": (repaired_text or "")[:200]
                }), 200  # not 500: game continues, just no move
            else:
                parsed_move = parsed_repair
                tokens_used += tokens_used_repair
                cost += cost_repair


        # Cache the response
        response_cache[state_hash] = parsed_move
        
        # Update statistics
        request_stats["total_tokens"] += tokens_used
        request_stats["total_cost"] += cost

        logger.info(f"Successfully suggested move: {parsed_move['piece_id']} → "
                   f"({parsed_move['target']['row']},{parsed_move['target']['col']})")

        return jsonify({
            "success": True,
            "piece_id": parsed_move["piece_id"],
            "target": parsed_move["target"],
            "reasoning": parsed_move["reasoning"],
            "model": model,
            "tokens_used": tokens_used,
            "cost": f"${cost:.6f}",
            "cached": False,
            "request_number": request_stats["total_requests"]
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error in /api/move endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}", "success": False}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint with service statistics"""
    is_valid, error = validate_api_key()
    
    stats = {
        "status": "ok" if is_valid else "degraded",
        "api_configured": is_valid,
        "message": error if error else "Service operational",
        "requests_processed": request_stats["total_requests"],
        "cache_hits": request_stats["cache_hits"],
        "cache_misses": request_stats["cache_misses"],
        "cache_hit_rate": f"{(request_stats['cache_hits'] / max(request_stats['total_requests'], 1) * 100):.1f}%",
        "total_tokens_used": request_stats["total_tokens"],
        "total_cost": f"${request_stats['total_cost']:.6f}",
        "cache_entries": len(response_cache)
    }
    
    logger.info(f"Health check: {stats}")
    return jsonify(stats), 200 if is_valid else 503


@app.route("/api/models", methods=["GET"])
def get_available_models():
    """Return available models with pricing information"""
    models = [
        {
            "id": "openai/gpt-4o-mini",
            "name": "GPT-4o Mini",
            "tier": "fast",
            "cost": "low",
            "input_cost": "$0.00015/1K tokens",
            "output_cost": "$0.0006/1K tokens",
            "recommended": True
        },
        {
            "id": "openai/gpt-4-turbo",
            "name": "GPT-4 Turbo",
            "tier": "powerful",
            "cost": "high",
            "input_cost": "$0.01/1K tokens",
            "output_cost": "$0.03/1K tokens",
            "recommended": False
        },
        {
            "id": "anthropic/claude-3-haiku",
            "name": "Claude 3 Haiku",
            "tier": "balanced",
            "cost": "low",
            "input_cost": "$0.00025/1K tokens",
            "output_cost": "$0.00125/1K tokens",
            "recommended": False
        },
    ]
    
    logger.info("Models list requested")
    return jsonify({"models": models, "default_model": DEFAULT_MODEL}), 200


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get service statistics"""
    total_requests = request_stats["total_requests"]
    
    stats = {
        "requests_processed": total_requests,
        "cache_hits": request_stats["cache_hits"],
        "cache_misses": request_stats["cache_misses"],
        "cache_hit_rate": f"{(request_stats['cache_hits'] / max(total_requests, 1) * 100):.1f}%",
        "total_tokens_used": request_stats["total_tokens"],
        "total_cost": f"${request_stats['total_cost']:.6f}",
        "average_cost_per_request": f"${request_stats['total_cost'] / max(total_requests, 1):.6f}",
        "cache_entries": len(response_cache),
        "timestamp": datetime.now().isoformat()
    }
    
    logger.info(f"Stats requested: {stats}")
    return jsonify(stats), 200


@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    """Clear the response cache"""
    global response_cache
    cleared_entries = len(response_cache)
    response_cache.clear()
    
    logger.info(f"Cache cleared: {cleared_entries} entries removed")
    return jsonify({
        "success": True,
        "cleared_entries": cleared_entries,
        "cache_now_empty": len(response_cache) == 0
    }), 200


@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded"""
    logger.warning(f"Rate limit exceeded")
    return jsonify({
        "error": "Rate limit exceeded. Maximum 30 requests per minute.",
        "success": False
    }), 429


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found", "success": False}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {e}")
    return jsonify({"error": "Internal server error", "success": False}), 500


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("Production-Grade LLM Game AI Service Starting")
    logger.info(f"API Configured: {'Yes' if API_KEY else 'No'}")
    logger.info(f"Default Model: {DEFAULT_MODEL}")
    logger.info(f"Rate Limiting: 30 requests/minute")
    logger.info("Endpoints: /api/move (main), /api/health, /api/models, /api/stats")
    logger.info("=" * 70)
    
    # For development only - use gunicorn in production
    app.run(debug=False, host="127.0.0.1", port=5000)