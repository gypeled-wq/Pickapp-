import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Co-Parenting Logistics Engine" });
  });

  // AI Natural Language Input Endpoint
  app.post("/api/parse-nl", async (req, res) => {
    try {
      const { text, currentParentId, children, dateContext } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text input is required" });
      }

      const today = dateContext || new Date().toISOString().split("T")[0];

      const prompt = `You are an AI assistant for a Co-Parenting & Family Logistics App.
Analyze the following natural language input from a co-parent and classify/extract structured information.

Today's Date: ${today}
Current Logged-in Parent ID: ${currentParentId || "parent1"}
Available Children: ${JSON.stringify(children || [{ id: "child1", name: "Emma" }, { id: "child2", name: "Noah" }])}

Input text: "${text}"

Categorize this input into EXACTLY ONE of the following item types:
1. "expense": e.g., "Bought new shoes for Noah for $50", "Paid $120 for soccer registration"
2. "packing_item": e.g., "Need to pack soccer gear for Emma for Friday", "Pack violin for Noah"
3. "medication": e.g., "Noah needs 2 puffs inhaler every morning at 8am", "Gave Tylenol at 4pm"
4. "inventory_item": e.g., "Noah needs new winter boots", "Emma outgrew her rain jacket"
5. "schedule_update": e.g., "Swapped Friday night with Mom", "Dad taking kids on Saturday", "Handoff at 5pm tomorrow at school"
6. "task": e.g., "Pickup Noah from violin at 4:30pm on Wednesday"

Return a structured JSON object according to the schema provided.
For dates like "today", "tomorrow", "Friday", calculate the exact YYYY-MM-DD relative to Today's Date (${today}).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "One of: 'expense', 'packing_item', 'medication', 'inventory_item', 'schedule_update', 'task'",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence score between 0.0 and 1.0",
              },
              summary: {
                type: Type.STRING,
                description: "A friendly 1-sentence confirmation of what was parsed",
              },
              expenseData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  childId: { type: Type.STRING },
                  paidByParentId: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
              },
              packingData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  childId: { type: Type.STRING },
                  neededForDate: { type: Type.STRING },
                  targetHomeId: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
              },
              medicationData: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  childId: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  timeSchedule: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
              },
              inventoryData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  childId: { type: Type.STRING },
                  status: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
              },
              scheduleData: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  primaryParentId: { type: Type.STRING },
                  hasHandoff: { type: Type.BOOLEAN },
                  handoffTime: { type: Type.STRING },
                  handoffLocation: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  isSwapRequest: { type: Type.BOOLEAN },
                },
              },
              taskData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  childId: { type: Type.STRING },
                  type: { type: Type.STRING },
                  time: { type: Type.STRING },
                  date: { type: Type.STRING },
                  responsibleParentId: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
              },
            },
            required: ["category", "summary"],
          },
        },
      });

      const parsedResult = JSON.parse(response.text || "{}");
      return res.json({ success: true, result: parsedResult });
    } catch (error: any) {
      console.error("Error parsing natural language with Gemini:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process text with AI",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NestFlow Co-Parenting server running on port ${PORT}`);
  });
}

startServer();
