// ai-engine/train-model.js
const fs = require('fs');
const path = require('path');
const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');
const storage = require('../utils/storage');
const { checkSafety } = require('../utils/security');

// Configuration
const MODEL_DIR = path.join(__dirname, '../models');
const NLP_DATA_PATH = path.join(MODEL_DIR, 'nlp-dataset.json');
const CODE_DATA_PATH = path.join(MODEL_DIR, 'code-dataset.json');

class ModelTrainer {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.classifier = new natural.BayesClassifier();
        this.codeModel = null;
    }

    async initialize() {
        await this.ensureModelDirectory();
        await this.loadDatasets();
    }

    async ensureModelDirectory() {
        if (!fs.existsSync(MODEL_DIR)) {
            fs.mkdirSync(MODEL_DIR, { recursive: true });
        }
    }

    async loadDatasets() {
        try {
            // Chargement des datasets existants
            this.nlpDataset = fs.existsSync(NLP_DATA_PATH) 
                ? JSON.parse(fs.readFileSync(NLP_DATA_PATH, 'utf8')) 
                : { intents: [] };

            this.codeDataset = fs.existsSync(CODE_DATA_PATH)
                ? JSON.parse(fs.readFileSync(CODE_DATA_PATH, 'utf8'))
                : { examples: [] };
        } catch (err) {
            console.error('Erreur chargement datasets:', err);
            process.exit(1);
        }
    }

    async trainNLPModel() {
        console.log('Début entraînement modèle NLP...');
        
        // Ajout des données d'entraînement
        for (const intent of this.nlpDataset.intents) {
            for (const example of intent.examples) {
                // Vérification de sécurité
                const safetyCheck = checkSafety(example);
                if (!safetyCheck.safe) {
                    console.warn(`Exemple rejeté: ${example}`);
                    continue;
                }

                this.classifier.addDocument(example, intent.tag);
            }
        }

        // Entraînement
        this.classifier.train();

        // Sauvegarde du modèle
        this.classifier.save(path.join(MODEL_DIR, 'nlp-model.json'), (err) => {
            if (err) {
                console.error('Erreur sauvegarde modèle NLP:', err);
            } else {
                console.log('Modèle NLP entraîné et sauvegardé!');
                console.log(`Précision estimée: ${this.testNLPModel()}%`);
            }
        });
    }

    testNLPModel() {
        // Méthode simplifiée d'évaluation
        const testCases = [
            { input: "Bonjour", expected: "salutation" },
            { input: "Aide-moi", expected: "aide" }
        ];

        let correct = 0;
        for (const test of testCases) {
            if (this.classifier.classify(test.input) === test.expected) {
                correct++;
            }
        }

        return ((correct / testCases.length) * 100).toFixed(2);
    }

    async trainCodeModel() {
        console.log('Début entraînement modèle de code...');
        
        try {
            // Préparation des données (simplifiée)
            const examples = this.codeDataset.examples.map(ex => ({
                input: ex.description,
                output: ex.code
            }));

            // Création du modèle (exemple simplifié)
            this.codeModel = tf.sequential();
            this.codeModel.add(tf.layers.dense({ units: 32, inputShape: [100], activation: 'relu' }));
            this.codeModel.add(tf.layers.dense({ units: 64, activation: 'relu' }));
            this.codeModel.add(tf.layers.dense({ 
                units: examples[0].output.split('\n').length * 20, 
                activation: 'softmax' 
            }));

            // Compilation
            this.codeModel.compile({
                optimizer: 'adam',
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            console.log('Modèle de code compilé. Entraînement en cours...');

            // Sauvegarde
            await this.codeModel.save(`file://${path.join(MODEL_DIR, 'code-model')}`);
            console.log('Modèle de code sauvegardé!');

        } catch (err) {
            console.error('Erreur entraînement modèle code:', err);
        }
    }

    async addTrainingData(dataType, data) {
        try {
            // Validation des données
            if (!['nlp', 'code'].includes(dataType)) {
                throw new Error('Type de données invalide');
            }

            const safetyCheck = checkSafety(JSON.stringify(data));
            if (!safetyCheck.safe) {
                throw new Error('Données non sécurisées: ' + safetyCheck.message);
            }

            // Ajout aux datasets
            if (dataType === 'nlp') {
                this.nlpDataset.intents.push(data);
                fs.writeFileSync(NLP_DATA_PATH, JSON.stringify(this.nlpDataset, null, 2));
            } else {
                this.codeDataset.examples.push(data);
                fs.writeFileSync(CODE_DATA_PATH, JSON.stringify(this.codeDataset, null, 2));
            }

            console.log(`Données ${dataType} ajoutées avec succès!`);
            return true;
        } catch (err) {
            console.error('Erreur ajout données:', err);
            return false;
        }
    }
}

// Exécution automatique si lancé directement
(async () => {
    try {
        const trainer = new ModelTrainer();
        await trainer.initialize();

        // Entraînement des modèles
        await trainer.trainNLPModel();
        await trainer.trainCodeModel();

        // Exemple d'ajout de données
        await trainer.addTrainingData('nlp', {
            tag: "salutation",
            examples: ["Salut", "Bonjour", "Hello"],
            responses: ["Bonjour !", "Salut !"]
        });

        console.log('Entraînement terminé avec succès!');
        process.exit(0);
    } catch (err) {
        console.error('Erreur durant l\'entraînement:', err);
        process.exit(1);
    }
})();

module.exports = ModelTrainer;