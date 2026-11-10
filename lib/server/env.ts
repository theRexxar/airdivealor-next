import { z } from "zod";

/** Server configuration, read from the environment (see .env.example). */
const schema = z.object({
  SITE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("mysql://airdive:airdive@127.0.0.1:3306/airdivealor"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  S3_ENDPOINT: z.string().default("http://127.0.0.1:9000"),
  /** Address browsers use for presigned uploads, if different from S3_ENDPOINT (e.g. internal Docker hostname). */
  S3_UPLOAD_ENDPOINT: z.string().default(""),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("airdivealor-media"),
  S3_PUBLIC_URL: z.string().default("http://127.0.0.1:9000/airdivealor-media"),
  BREVO_API_KEY: z.string().default(""),
  /** Brevo's API. Only changed for tests (a local stand-in that records the emails). */
  BREVO_API_URL: z.string().url().default("https://api.brevo.com/v3"),
  MAIL_FROM_EMAIL: z.string().default("no-reply@airdivealor.com"),
  MAIL_FROM_NAME: z.string().default("Air Dive Alor"),
  /** Where booking enquiries from the website go. */
  ENQUIRY_EMAIL: z.string().email().default("contact@airdivealor.com"),
  SEED_ADMIN_EMAIL: z.string().default("admin@airdivealor.com"),
  SEED_ADMIN_PASSWORD: z.string().default(""),
});

export const env = schema.parse(process.env);
