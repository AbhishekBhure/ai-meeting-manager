import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini client with our API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// We'll use Gemini 1.5 Flash — fast and free tier
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
})

export default genAI