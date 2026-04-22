import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("DB timeout")), 3000)
  );

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeout,
    ]);

    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        version: process.env.npm_package_version ?? "0.1.0",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
