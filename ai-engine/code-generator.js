import codeSamples from '../models/code-samples.json';

export function generateCode(description, language) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const baseTemplate = codeSamples.templates[language] || '';
            const example = codeSamples.examples[language]?.[0] || '';
            
            resolve({
                code: `/* ${description} */\n${baseTemplate}\n${example}`,
                language,
                warnings: []
            });
        }, 1000);
    });
}