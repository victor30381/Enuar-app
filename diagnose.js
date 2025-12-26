import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyCHS8BcGeerQYj1YwGWKLXMuYh9USpCJdc';
const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-flash-latest",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-exp-1206",
    "gemini-2.0-flash-exp",
    "gemini-pro-latest"
];

async function testModels() {
    console.log("Iniciando diagnóstico de modelos...");

    for (const modelName of modelsToTest) {
        try {
            console.log(`\nProbando modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hola, esto es una prueba rapida.");
            const response = await result.response;
            console.log(`✅ ÉXITO con ${modelName}!`);
            console.log("Respuesta:", response.text().substring(0, 50) + "...");
            return; // Stop after first success
        } catch (error) {
            console.log(`❌ FALLÓ ${modelName}`);
            console.log(`Error: ${error.message}`);
        }
    }
    console.log("\n❌ TODOS los modelos fallaron. Revisar clave o cuota global.");
}

testModels();
