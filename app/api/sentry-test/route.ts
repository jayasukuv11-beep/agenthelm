import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  throw new Error("Deliberate production Sentry test error.")
}
