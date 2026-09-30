import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/ecotrace_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z
    .string()
    .default('ecotrace_dev_jwt_access_secret_key_minimum_32_chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('ecotrace_dev_jwt_refresh_secret_key_minimum_32_chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('placeholder_secret'),
  GEMINI_API_KEY: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
