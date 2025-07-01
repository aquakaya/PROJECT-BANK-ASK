// utils/storage.js
const fs = require('fs');
const path = require('path');

class AIStorage {
    constructor(storageType = 'json') {
        this.storageType = storageType;
        this.basePath = path.join(__dirname, '../data');
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    /**
     * Sauvegarde des données
     * @param {string} key - Clé d'identification
     * @param {object} data - Données à sauvegarder
     * @param {string} [collection='general'] - Collection/catégorie
     */
    async save(key, data, collection = 'general') {
        switch (this.storageType) {
            case 'json':
                return this.saveToJson(key, data, collection);
            case 'memory':
                return this.saveToMemory(key, data, collection);
            default:
                throw new Error('Méthode de stockage non supportée');
        }
    }

    /**
     * Chargement des données
     * @param {string} key - Clé d'identification
     * @param {string} [collection='general'] - Collection/catégorie
     */
    async load(key, collection = 'general') {
        switch (this.storageType) {
            case 'json':
                return this.loadFromJson(key, collection);
            case 'memory':
                return this.loadFromMemory(key, collection);
            default:
                throw new Error('Méthode de stockage non supportée');
        }
    }

    // Méthodes spécifiques JSON
    async saveToJson(key, data, collection) {
        const collectionPath = path.join(this.basePath, `${collection}.json`);
        let allData = {};

        try {
            if (fs.existsSync(collectionPath)) {
                const fileData = fs.readFileSync(collectionPath, 'utf8');
                allData = JSON.parse(fileData);
            }
        } catch (err) {
            console.error('Erreur lecture fichier:', err);
        }

        allData[key] = data;

        try {
            fs.writeFileSync(collectionPath, JSON.stringify(allData, null, 2));
            return true;
        } catch (err) {
            console.error('Erreur écriture fichier:', err);
            return false;
        }
    }

    async loadFromJson(key, collection) {
        const collectionPath = path.join(this.basePath, `${collection}.json`);

        if (!fs.existsSync(collectionPath)) {
            return null;
        }

        try {
            const fileData = fs.readFileSync(collectionPath, 'utf8');
            const allData = JSON.parse(fileData);
            return allData[key] || null;
        } catch (err) {
            console.error('Erreur chargement fichier:', err);
            return null;
        }
    }

    // Méthodes spécifiques mémoire (pour développement)
    saveToMemory(key, data, collection) {
        if (!this.memoryStorage) {
            this.memoryStorage = {};
        }
        if (!this.memoryStorage[collection]) {
            this.memoryStorage[collection] = {};
        }
        
        this.memoryStorage[collection][key] = data;
        return true;
    }

    loadFromMemory(key, collection) {
        if (!this.memoryStorage || !this.memoryStorage[collection]) {
            return null;
        }
        return this.memoryStorage[collection][key] || null;
    }

    // Gestion des conversations
    async saveConversation(userId, messages) {
        return this.save(userId, {
            messages,
            lastUpdated: new Date().toISOString()
        }, 'conversations');
    }

    async loadConversation(userId) {
        return this.load(userId, 'conversations');
    }

    // Gestion des connaissances de l'IA
    async addKnowledge(key, content) {
        const knowledge = await this.load('knowledge', 'ai') || {};
        knowledge[key] = content;
        return this.save('knowledge', knowledge, 'ai');
    }

    async getKnowledge(key) {
        const knowledge = await this.load('knowledge', 'ai') || {};
        return knowledge[key];
    }
}

// Export singleton pour une utilisation globale
module.exports = new AIStorage(process.env.STORAGE_TYPE || 'json');