import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { AiClassificationResult } from '../types';

export const ALLOWED_WASTE_CATEGORIES = [
  'PCB_HIGH_GRADE',
  'PCB_LOW_GRADE',
  'LITHIUM_BATTERY',
  'DISPLAY_UNIT',
  'MIXED_APPLIANCE',
  'PLASTIC_CASING',
  'METALS',
  'OTHER_E_WASTE',
] as const;

export type AllowedWasteCategory = (typeof ALLOWED_WASTE_CATEGORIES)[number];

const FALLBACK_CLASSIFICATION: AiClassificationResult = {
  predictedCategory: 'OTHER_E_WASTE',
  confidence: 0.5,
  reasoning: 'Advisory fallback categorization active (Gemini API unavailable or key unconfigured)',
  isFallback: true,
  fraudRiskScore: 0.0,
  suggestedAction: 'MANUAL_VERIFICATION',
};

const SYSTEM_PROMPT = `
You are an expert e-waste material inspection advisor for EcoTrace India.
Analyze the provided scrap/electronic waste item and classify it into EXACTLY ONE of the following valid codes:
- PCB_HIGH_GRADE: Telecom, server, motherboard, or gold-bearing printed circuit boards.
- PCB_LOW_GRADE: Power supply boards, single-sided consumer electronic circuit boards.
- LITHIUM_BATTERY: Lithium-ion cells, laptop/smartphone battery packs, pouch cells.
- DISPLAY_UNIT: LCD/LED screens, flat-panel monitors, CRT displays, TV panels.
- MIXED_APPLIANCE: Small domestic appliances, blenders, microwave components, fractional motors.
- PLASTIC_CASING: Flame-retardant electronics enclosures, printer bodies, plastic shells.
- METALS: Copper wire coils, aluminium heatsinks, structural metal scrap.
- OTHER_E_WASTE: Mixed cables, chargers, adapters, and uncategorized electronics accessories.

Respond with strict JSON ONLY using this schema:
{
  "predictedCategory": "CATEGORY_CODE",
  "confidence": 0.95,
  "reasoning": "Clear brief rationale for classification",
  "fraudRiskScore": 0.0
}
`.trim();

export class AiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;

  constructor(apiKey?: string, client?: GoogleGenAI | null) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? '';
    if (client !== undefined) {
      this.client = client;
    } else {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    if (this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.startsWith('AIzaSyxxxxxx')) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey.trim() });
      } catch (err) {
        logger.warn({ err }, 'Failed to initialize GoogleGenAI client; will use fallback mode');
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  async classifyWaste(imageBase64OrUrl: string): Promise<AiClassificationResult> {
    if (!this.client || !this.apiKey || this.apiKey.trim() === '') {
      return {
        ...FALLBACK_CLASSIFICATION,
        reasoning: 'Gemini API key is not configured. Deterministic advisory fallback applied.',
      };
    }

    try {
      let mimeType = 'image/jpeg';
      let rawBase64 = imageBase64OrUrl;

      if (imageBase64OrUrl.startsWith('data:')) {
        const matches = imageBase64OrUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches[1] && matches[2]) {
          mimeType = matches[1];
          rawBase64 = matches[2];
        }
      }

      const isHttpUrl = imageBase64OrUrl.startsWith('http://') || imageBase64OrUrl.startsWith('https://');

      const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: `${SYSTEM_PROMPT}\n\nPlease inspect and classify the attached e-waste item.` },
      ];

      if (isHttpUrl) {
        contentParts.push({ text: `Image URL for inspection: ${imageBase64OrUrl}` });
      } else {
        contentParts.push({
          inlineData: {
            mimeType,
            data: rawBase64,
          },
        });
      }

      const response = await this.client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
      });

      const responseText = response.text ?? '';
      const parsed = this.parseGeminiJson(responseText);

      if (parsed) {
        const categoryCode = this.validateCategory(parsed.predictedCategory);
        const confidence = Math.min(1.0, Math.max(0.1, Number(parsed.confidence) || 0.85));

        return {
          predictedCategory: categoryCode,
          confidence: Number(confidence.toFixed(2)),
          reasoning: parsed.reasoning || 'Categorized via Google Gemini 1.5 Flash Vision',
          isFallback: false,
          fraudRiskScore: Number(Number(parsed.fraudRiskScore || 0).toFixed(2)),
          suggestedAction: confidence >= 0.8 ? 'AUTO_CONFIRM' : 'MANUAL_VERIFICATION',
        };
      }

      return {
        ...FALLBACK_CLASSIFICATION,
        reasoning: 'Gemini response could not be parsed as structured JSON. Fallback applied.',
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn({ error: errorMessage }, 'Gemini 1.5 Flash Vision classification failed; returning fallback');

      return {
        ...FALLBACK_CLASSIFICATION,
        reasoning: `Vision API error: ${errorMessage}. Advisory fallback applied.`,
      };
    }
  }

  private parseGeminiJson(rawText: string): {
    predictedCategory?: string;
    confidence?: number;
    reasoning?: string;
    fraudRiskScore?: number;
  } | null {
    try {
      const cleaned = rawText
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonSubstring = cleaned.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonSubstring) as {
          predictedCategory?: string;
          confidence?: number;
          reasoning?: string;
          fraudRiskScore?: number;
        };
      }
    } catch {
      // Return null on parsing failure
    }
    return null;
  }

  private validateCategory(category?: string): AllowedWasteCategory {
    if (
      category &&
      ALLOWED_WASTE_CATEGORIES.includes(category.toUpperCase() as AllowedWasteCategory)
    ) {
      return category.toUpperCase() as AllowedWasteCategory;
    }
    return 'OTHER_E_WASTE';
  }
}

export const aiService = new AiService();
