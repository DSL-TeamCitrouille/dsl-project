grammar DamDam

entry Damier:
   'game' name=ID '{'
       board=Board
       pieces=Pieces
       (dice=Dice)?
       rules=Rules
       objective=Objective
   '}';


Board:
   'board' '{'
       'size' width=INT 'x' height=INT
   '}';


Pieces:
   'pieces' '{'
       (piece+=Piece)*
   '}';


Piece:
   'piece' name=ID '{'
       'color' color=ID
       'quantity' quantity=INT
   '}';


Dice:
   'dice' '{'
       'faces' faces=INT
       ('quantity' quantity=INT)?
   '}';


Rules:
   'rules' '{'
       (rule+=Rule)*
   '}';


Rule:
   MoveRule | DiceRule | CaptureRule | BoundaryRule | ActionRule | ChainRule;


MoveRule:
   'movement' '{'
       'alternating' between+=ID ('and' between+=ID)*
       ('firstPlayer' firstPlayer=ID)?
       ('direction' direction=('diagonal' | 'orthogonal' | 'any'))
       ('canMoveBackward' canMoveBackward=BOOLEAN)?
       ('exceptWhen' exception=STRING)?
   '}';


DiceRule:
   'dice' '{'
       'diceRolls' rolls=INT
   '}';


CaptureRule:
   'capture' '{'
       'allowed' allowed=BOOLEAN
       ('action' action=STRING)?
       ('message' message=STRING)?
   '}';


BoundaryRule:
   'boundary' '{'
       'stayInside' stayInside=BOOLEAN
   '}';


ActionRule:
   'action' '{'
       'type' type=('move' | 'capture' | 'both')
   '}';


ChainRule:
   'chaining' '{'
       'captures' capturesAllowed=BOOLEAN
       'moves' movesAllowed=BOOLEAN
   '}';


Objective:
   'objective' '{'
       (goal+=Goal)*
   '}';


Goal:
   WinByCapture | WinBySolitaire | WinByForfeit;


WinByCapture:
   'winByCapture' '{'
       'captureAll' target=ID
   '}';


WinBySolitaire:
   'winBySolitaire' '{'
       'removeOwn' removeOwn=BOOLEAN
       'noMoreMoves' movesLeft=INT
   '}';


WinByForfeit:
   'winByForfeit' '{'
       'allowed' allowed=BOOLEAN
   '}';


terminal INT returns number: /[0-9]+/;
terminal BOOLEAN returns boolean: /true|false/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;


hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;