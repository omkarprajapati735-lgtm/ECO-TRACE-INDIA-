import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../src/services/ai.service';
import { GoogleGenAI } from '@google/genai';

describe('Unit Tests: Advisory Gemini Vision Waste Classifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return deterministic fallback when Gemini API key is missing or blank', async () => {
    const aiService = new AiService('');
    const result = await aiService.classifyWaste('data:image/jpeg;base64,samplebase64string');

    expect(result).toBeDefined();
    expect(result.isFallback).toBe(true);
    expect(result.predictedCategory).toBe('OTHER_E_WASTE');
    expect(result.confidence).toBe(0.5);
    expect(result.suggestedAction).toBe('MANUAL_VERIFICATION');
  });

  it('should never throw unhandled exception when input image is invalid or empty', async () => {
    const aiService = new AiService('');
    await expect(aiService.classifyWaste('')).resolves.not.toThrow();
  });

  it('should handle simulated Gemini API error gracefully with deterministic fallback', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockRejectedValue(new Error('ETIMEDOUT: Connection to Gemini API timed out')),
      },
    } as unknown as GoogleGenAI;

    const aiService = new AiService('mock-api-key', mockClient);
    const result = await aiService.classifyWaste('data:image/jpeg;base64,dGVzdA==');

    expect(result.isFallback).toBe(true);
    expect(result.predictedCategory).toBe('OTHER_E_WASTE');
    expect(result.confidence).toBe(0.5);
    expect(result.reasoning).toContain('ETIMEDOUT');
  });

  it('should parse valid structured JSON from Gemini vision model successfully', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            predictedCategory: 'PCB_HIGH_GRADE',
            confidence: 0.94,
            reasoning: 'Server motherboard with gold-plated PCI slots and telecommunication chips',
            fraudRiskScore: 0.02,
          }),
        }),
      },
    } as unknown as GoogleGenAI;

    const aiService = new AiService('mock-api-key', mockClient);
    const result = await aiService.classifyWaste('data:image/jpeg;base64,dGVzdA==');

    expect(result.isFallback).toBe(false);
    expect(result.predictedCategory).toBe('PCB_HIGH_GRADE');
    expect(result.confidence).toBe(0.94);
    expect(result.suggestedAction).toBe('AUTO_CONFIRM');
    expect(result.reasoning).toContain('gold-plated');
  });

  it('should strip markdown backticks and parse embedded JSON safely', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: '```json\n{\n  "predictedCategory": "LITHIUM_BATTERY",\n  "confidence": 0.88,\n  "reasoning": "Smartphone Li-ion pouch cell"\n}\n```',
        }),
      },
    } as unknown as GoogleGenAI;

    const aiService = new AiService('mock-api-key', mockClient);
    const result = await aiService.classifyWaste('data:image/jpeg;base64,dGVzdA==');

    expect(result.isFallback).toBe(false);
    expect(result.predictedCategory).toBe('LITHIUM_BATTERY');
    expect(result.confidence).toBe(0.88);
  });

  it('should fallback to OTHER_E_WASTE if model outputs an unknown category name', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            predictedCategory: 'UNKNOWN_SPACE_TRASH',
            confidence: 0.99,
            reasoning: 'Unclassified scrap',
          }),
        }),
      },
    } as unknown as GoogleGenAI;

    const aiService = new AiService('mock-api-key', mockClient);
    const result = await aiService.classifyWaste('https://example.com/scrap.jpg');

    expect(result.predictedCategory).toBe('OTHER_E_WASTE');
  });
});
