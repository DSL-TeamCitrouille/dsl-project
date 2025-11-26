import { type Module, inject } from 'langium';
import { createDefaultModule, createDefaultSharedModule, type DefaultSharedModuleContext, type LangiumServices, type LangiumSharedServices, type PartialLangiumServices } from 'langium/lsp';
import { DamDamGeneratedModule, DamDamGeneratedSharedModule } from './generated/module.js';
import { DamDamValidator, registerValidationChecks } from './dam-dam-validator.js';

// Declaration of custom services

export type DamDamAddedServices = {
    validation: {
        DamDamValidator: DamDamValidator
    }
}

// Union of Langium default services and your custom services
export type DamDamServices = LangiumServices & DamDamAddedServices


// Dependency injection module that overrides Langium default services and contributes the declared custom services.
export const DamDamModule: Module<DamDamServices, PartialLangiumServices & DamDamAddedServices> = {
    validation: {
        DamDamValidator: () => new DamDamValidator()
    }
};


// Create the full set of services required by Langium.
export function createDamDamServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    DamDam: DamDamServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        DamDamGeneratedSharedModule
    );
    const DamDam = inject(
        createDefaultModule({ shared }),
        DamDamGeneratedModule,
        DamDamModule
    );
    shared.ServiceRegistry.register(DamDam);
    registerValidationChecks(DamDam);
    if (!context.connection) {
        // We don't run inside a language server, therefore, we initialize the configuration provider instantly
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, DamDam };
}
