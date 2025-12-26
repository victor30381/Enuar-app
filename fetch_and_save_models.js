import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = 'AIzaSyCHS8BcGeerQYj1YwGWKLXMuYh9USpCJdc';

async function saveModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const models = data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));

            fs.writeFileSync('available_models.json', JSON.stringify(models, null, 2));
            console.log("Models saved to available_models.json");
        } else {
            console.log("No models found:", data);
            fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
        fs.writeFileSync('available_models.json', JSON.stringify({ error: error.message }));
    }
}

saveModels();
