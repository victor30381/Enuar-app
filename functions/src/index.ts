import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

// Access API Key from Firebase Config
// Set it via: firebase functions:config:set gemini.key="YOUR_API_KEY"
const getApiKey = () => functions.config().gemini?.key;

export const generateWod = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to generate a WOD."
        );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "API Key not configured."
        );
    }

    const prompt = data.prompt;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const systemInstruction = `You are an elite CrossFit coach. 
    Generate a challenging but scalable "Workout of the Day" (WOD). 
    Structure it clearly with:
    1. WARM-UP (5-10 mins)
    2. STRENGTH/SKILL
    3. METCON (The main workout)
    4. COOL DOWN
    
    Use standard CrossFit terminology (AMRAP, EMOM, RFT). 
    Format the output in clean Markdown. Keep it concise.
    IMPORTANT: Respond in SPANISH (Español).`;

        const result = await model.generateContent(
            `${systemInstruction}\n\n${prompt || "Generate a random intermediate level WOD focusing on general physical preparedness."}`
        );

        return { text: result.response.text() };
    } catch (error: any) {
        console.error("Gemini Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Error generating WOD");
    }
});


export const parseWodContent = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to analyze content."
        );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "API Key not configured."
        );
    }

    const { base64OrText, mimeType } = data;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const isText = mimeType.startsWith('text/') || mimeType === 'application/json';
        let contentParts: any[] = [];

        if (isText) {
            contentParts = [base64OrText];
        } else {
            // Clean base64 string if needed
            const base64Data = base64OrText.includes(',') ? base64OrText.split(',')[1] : base64OrText;
            contentParts = [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ];
        }

        const prompt = `
        You are an expert CrossFit coach AI.
        Your task: Analyze the provided content (image, PDF, or text) which contains a Workout of the Day (WOD).
        Extract the workout structure and return it as strict JSON.
        
        JSON Structure:
        {
            "title": "Title of the WOD (or derived from date/content)",
            "sections": [
                { "id": "generated_id", "title": "Section Name (e.g., Warm Up, Metcon)", "content": "Full details of the section" }
            ]
        }
        
        Rules:
        1. "content" usually lists exercises, reps, and rounds. Keep formatting clean.
        2. Generate unique random IDs for sections.
        3. Translate vague section names to standard terms (Warm Up, Skill, WOD, Cool Down) if applicable, but prefer original names if clear.
        4. IMPORTANT: Return ONLY valid JSON. No markdown backticks.
        5. Respond in SPANISH.
        `;

        const result = await model.generateContent([prompt, ...contentParts]);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error: any) {
        console.error("Gemini Parse Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Error parsing content");
    }
});
