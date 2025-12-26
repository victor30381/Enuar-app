import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyCrjuoQWubtMoTxx7KLQLfgWct7oxuGJi8';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("Fetching available models...");
    // The SDK doesn't have a direct listModels on the main class in some versions, 
    // but the error message suggested calling ListModels. 
    // Actually, checking docs: genAI.getGenerativeModel is the main entry. 
    // We can try a standard fetch to the API endpoint if the SDK doesn't expose list.

    // Let's try to just hit one we know exists for sure, likely 'gemini-pro' (1.0)
    // But better yet, let's use the REST API to list models to be 100% sure.

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      const names = data.models
        .map(m => m.name.replace('models/', ''))
        .filter(n => n.includes('gemini-1.5') || n.includes('gemini-2.0'))
        .sort();

      console.log("--- FOUND MODELS START ---");
      names.forEach(n => console.log(n));
      console.log("--- FOUND MODELS END ---");
    } else {
      console.log("ERROR: No models found. Raw response:");
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
