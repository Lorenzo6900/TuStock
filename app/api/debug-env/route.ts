import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    AUTH_SECRET: {
      present: !!process.env.AUTH_SECRET,
      length: process.env.AUTH_SECRET?.length ?? 0,
    },
    AUTH_GOOGLE_ID: {
      present: !!process.env.AUTH_GOOGLE_ID,
      length: process.env.AUTH_GOOGLE_ID?.length ?? 0,
    },
    AUTH_GOOGLE_SECRET: {
      present: !!process.env.AUTH_GOOGLE_SECRET,
      length: process.env.AUTH_GOOGLE_SECRET?.length ?? 0,
    },
    DATABASE_URL: {
      present: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length ?? 0,
    },
    GEMINI_API_KEY: {
      present: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length ?? 0,
    },
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
    allEnvKeys: Object.keys(process.env).sort(),
  });
}
