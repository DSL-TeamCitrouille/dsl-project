// npx tsx src/dam-dam-validator.ts --file src/variantes/variante1/variante1.dam

import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { DamDamAstType, Damier, Piece, MoveRule } from './generated/ast.js';
import type { DamDamServices } from './dam-dam-module.js';

export function registerValidationChecks(services: DamDamServices) {
    console.log('Registering DamDam validation checks...');
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DamDamValidator;
    const checks: ValidationChecks<DamDamAstType> = {

        Damier: [
            validator.checkBoardSizeIsValid,
            validator.checkValidPieceCount,
        ],

        MoveRule: [
            validator.checkMovementPiecesExist,
        ],

        Piece: validator.checkPieceColorConsistency,


    };
    registry.register(checks, validator);
}

export class DamDamValidator {

    private findRoot(node: any): Damier | null {
        let current = node;
        while (current) {
            if (current.$type === 'Damier') {
                return current as Damier;
            }
            current = current.$container;
        }
        return null;
    }
    /**
     * Board Size Constraint - COMPILE-TIME 
     * Ensures the board size is within reasonable bounds (between 2 and 26) and it is a pair number
     * This prevents impractical board sizes that could affect gameplay
     */
    checkBoardSizeIsValid(damier: Damier, accept: ValidationAcceptor): void {
        const boardSize = damier.board.size;
        const MIN_SIZE = 2;
        const MAX_SIZE = 26;

        if (boardSize < MIN_SIZE) {
            accept('error', 
                `Board size must be at least ${MIN_SIZE}. Current size: ${boardSize}.`,
                { node: damier.board, property: 'size' }
            );
        }

        if (boardSize > MAX_SIZE) {
            accept('error',
                `Board size should not exceed ${MAX_SIZE} (practical limit). Current size: ${boardSize}.`,
                { node: damier.board, property: 'size' }
            );
        }
        if (boardSize % 2 !== 0) {
            accept('error',
                `Board size should be an even number for balanced gameplay. Current size: ${boardSize}.`,
                { node: damier.board, property: 'size' }
            );
        }
    }

    /**
     * Movement Rule Piece References
     * VARIABILITY CONSTRAINT: Ensures all pieces mentioned in movement rules are defined
     * This prevents undefined piece references in game rules
     */
    checkMovementPiecesExist(moveRule: MoveRule, accept: ValidationAcceptor): void {
        const damier = this.findRoot(moveRule) as Damier;
        if (!damier) return;

        const definedPieceNames = new Set(damier.pieces.piece.map(p => p.name));

        // Check all pieces in the "alternating" clause
        moveRule.between.forEach((pieceName, index) => {
            if (!definedPieceNames.has(pieceName)) {
                accept('error',
                    `Piece "${pieceName}" in movement rule is not defined in the pieces section.`,
                    { node: moveRule, property: 'between', index }
                );
            }
        });

        // Check firstPlayer if specified
        if (moveRule.firstPlayer && !definedPieceNames.has(moveRule.firstPlayer)) {
            accept('error',
                `First player piece "${moveRule.firstPlayer}" is not defined in the pieces section.`,
                { node: moveRule, property: 'firstPlayer' }
            );
        }
    }

    /**
     * Piece Color Consistency (SKIN/UI Constraint)
     * Ensures piece colors are consistent and not duplicated
     * This validates the UI/SKIN layer - visual appearance constraints
     */
    checkPieceColorConsistency(piece: Piece, accept: ValidationAcceptor): void {
        const damier = this.findRoot(piece) as Damier;
        if (!damier) return;

        const colorMap = new Map<string, Piece>();

        damier.pieces.piece.forEach(p => {
            if (colorMap.has(p.color)) {
                const firstPiece = colorMap.get(p.color)!;
                if (firstPiece.name !== p.name) {
                    accept('warning',
                        `Color "${p.color}" is used by both "${firstPiece.name}" and "${p.name}". This may cause UI confusion.`,
                        { node: p, property: 'color' }
                    );
                }
            } else {
                colorMap.set(p.color, p);
            }
        });
    }

    /**
     * At Least One Objective
     * CONSTRAINT: Game must have at least one win condition
     * This ensures the game structure is complete
     */
    checkAtLeastOneObjective(damier: Damier, accept: ValidationAcceptor): void {
        if (damier.objective.goal.length === 0) {
            accept('error',
                'Game must have at least one objective/win condition.',
                { node: damier.objective }
            );
        }
    }

    /**
     * Valid Piece Count
     * CONSTRAINT: Ensures there are enough pieces defined for gameplay
     * This prevents scenarios where gameplay is impossible due to lack of pieces
     */
    checkValidPieceCount(damier: Damier, accept: ValidationAcceptor): void {
        const pieces = damier.pieces.piece;
        const direction = damier.rules.rule.find((r: any): r is MoveRule => 'direction' in r)?.direction || 'any';
        const boardSize = damier.board.size;

        if (pieces.length === 2 && direction === 'diagonal') {
            if( pieces[0].quantity != pieces[1].quantity ||  pieces[0].quantity % (boardSize / 2) != 0) {
                accept('error',
                    `For diagonal movement with 2 persons, both pieces must have equal quantities that are multiples of ${boardSize / 2}.`,
                    { node: damier.pieces }
                );
            }
        }
        
        if (pieces.length === 2 && direction === 'orthogonal') {
            if( pieces[0].quantity != pieces[1].quantity ||  pieces[0].quantity % boardSize != 0) {
                accept('error',
                    `For orthogonal movement with 2 persons, both pieces must have equal quantities that are multiples of ${boardSize}.`,
                    { node: damier.pieces }
                );
            }
        }

        if (pieces.length === 2 && direction === 'any') {
            if( pieces[0].quantity != pieces[1].quantity ||  pieces[0].quantity % boardSize != 0) {
                accept('error',
                    `For any-direction movement with 2 persons, both pieces must have equal quantities that are multiples of ${boardSize}.`,
                    { node: damier.pieces }
                );
            }
        }

        if (pieces.length === 1 && direction === 'diagonal') {
            if( pieces[0].quantity != (boardSize**2/2-1) ) {
                accept('error',
                    `For diagonal movement with 1 person, the piece quantity must be ${(boardSize/2)-1}.`,
                    { node: damier.pieces }
                );
            }
        }

        if (pieces.length === 1 && direction === 'orthogonal') {
            if( pieces[0].quantity != (boardSize**2)-1 ) {
                accept('error',
                    `For orthogonal movement with 1 person, the piece quantity must be ${(boardSize**2)-1}.`,
                    { node: damier.pieces }
                );
            }
        }

        if (pieces.length === 1 && direction === 'any') {
            if( pieces[0].quantity != (boardSize**2)-1 ) {
                accept('error',
                    `For any movement with 1 person, the piece quantity must be ${(boardSize**2)-1}.`,
                    { node: damier.pieces }
                );
            }
        }

    }

}