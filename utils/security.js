const bannedPatterns = [
    { pattern: /pirater|hack/i, message: "Je ne peux pas aider avec des sujets de piratage" },
    { pattern: /virus|malware/i, message: "Contenu malveillant détecté" }
];

export function checkSafety(input) {
    for (const { pattern, message } of bannedPatterns) {
        if (pattern.test(input)) {
            return { safe: false, message };
        }
    }
    return { safe: true };
}