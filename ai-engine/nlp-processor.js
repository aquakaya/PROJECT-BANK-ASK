import knowledgeBase from '../models/text-model.json';

export function processNaturalLanguage(input, context) {
    return new Promise((resolve) => {
        // Simulation de traitement NLP
        setTimeout(() => {
            const lowerInput = input.toLowerCase();
            
            // Réponses contextuelles
            if (context.length > 0) {
                const lastExchange = context[context.length - 1];
                if (lastExchange.includes('nom') && !lastExchange.includes('appelle')) {
                    return resolve("Je n'ai pas de nom, je suis juste une IA !");
                }
            }

            // Recherche dans la base de connaissances
            for (const [keyword, responses] of Object.entries(knowledgeBase)) {
                if (lowerInput.includes(keyword)) {
                    return resolve(
                        responses[Math.floor(Math.random() * responses.length)]
                    );
                }
            }

            // Réponse par défaut
            resolve("Je ne comprends pas parfaitement votre demande. Pouvez-vous reformuler ?");
        }, 800); // Simule un temps de traitement
    });
}