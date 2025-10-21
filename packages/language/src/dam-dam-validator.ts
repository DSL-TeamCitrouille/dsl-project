import type { ValidationChecks } from 'langium';
import type { DamDamAstType } from './generated/ast.js';
import type { DamDamServices } from './dam-dam-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DamDamServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DamDamValidator;
    const checks: ValidationChecks<DamDamAstType> = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        /*
        Element: validator.checkElement
        */
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DamDamValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    /*
    checkElement(element: Element, accept: ValidationAcceptor): void {
        // Always accepts
    }
    */
}
