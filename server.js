require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Importation des modules IA
const { AIEngine } = require('./ai-engine/core');
const { checkSafety } = require('./utils/security');

// Initialisation
const app = express();
const PORT = process.env.PORT || 3000;
const aiEngine = new AIEngine();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.post('/api/ask', async (req, res) => {
    try {
        const { question, mode = 'text' } = req.body;
        
        // Vérification de sécurité
        const safetyCheck = checkSafety(question);
        if (!safetyCheck.safe) {
            return res.status(403).json({ error: safetyCheck.message });
        }

        // Traitement par l'IA
        const response = await aiEngine.processInput(question, mode);
        
        // Journalisation
        logInteraction(question, response, mode);
        
        res.json(response);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// Serveur de fichiers statiques
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fonction de journalisation
function logInteraction(question, response, mode) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        question,
        response,
        mode
    };
    
    fs.appendFileSync(
        './logs/interactions.log',
        JSON.stringify(logEntry) + '\n'
    );
}

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Mode IA: ${process.env.AI_MODE || 'Local'}`);
});