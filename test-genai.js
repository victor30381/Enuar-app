import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';

// Manually read .env since we are running with node directly and might not have dotenv cli
const envConfig = dotenv.config();
const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyCrjuoQWubtMoTxx7KLQLfgWct7oxuGJi8'; // Fallback to the one user gave if dotenv fails in this context

console.log("Testing Gemini API with key:", apiKey ? "FOUND (starts with " + apiKey.substring(0, 5) + ")" : "MISSING");

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Model requested: gemini-1.5-flash");

        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("SUCCESS! Response:", text);
    } catch (error) {
        console.error("FAILURE:", error);
    }
}

test();
