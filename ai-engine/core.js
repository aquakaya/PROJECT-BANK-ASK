import { processNaturalLanguage } from './nlp-processor.js';
import { generateCode } from './code-generator.js';
import { checkSafety } from '../utils/security.js';

export class AIEngine {
    constructor() {
        this.context = [];
    }

    async processInput(input, mode = 'text') {
        // Vérification de sécurité
        const safetyCheck = checkSafety(input);
        if (!safetyCheck.safe) {
            return { error: safetyCheck.message };
        }

        // Traitement selon le mode
        switch(mode) {
            case 'code-html':
            case 'code-css':
            case 'code-js':
            case 'code-python':
                const language = mode.split('-')[1];
                return await generateCode(input, language);
            
            default:
                return await processNaturalLanguage(input, this.context);
        }
    }

    saveContext() {
        // À implémenter avec le système de stockage
    }
}