// npx tsx src/dam-dam-validator.ts --file src/variantes/variante1/variante1.dam

import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { DamDamAstType, Damier, Piece, MoveRule } from './generated/ast.js';
import type { DamDamServices } from './dam-dam-module.js';

export function registerValidationChecks(services: DamDamServices) {
    console.log('Registering DamDam validation checks...');
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DamDamValidator;
    const checks: ValidationChecks<DamDamAstType> = {

        Damier: validator.checkBoardSizeIsValid,

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
     * Ensures the board size is within reasonable bounds (between 2 and 26)
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
}