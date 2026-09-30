import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService, AiService } from '../services/ai.service';
import { ValidationError, UnauthorizedError } from '../errors/app-error';

export const classifyWasteSchema = z.object({
  image: z
    .string({ required_error: 'Image is required' })
    .min(1, 'Image data (Base64 data URI or URL) cannot be empty'),
});

export class AiController {
  constructor(private readonly ai: AiService = aiService) {}

  classifyWaste = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to use AI scrap classifier');
      }

      const parsed = classifyWasteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const result = await this.ai.classifyWaste(parsed.data.image);

      res.status(200).json({
        success: true,
        data: result,
        message: result.isFallback
          ? 'Advisory fallback classification applied'
          : 'Scrap category identified successfully by Gemini Vision',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const aiController = new AiController();
