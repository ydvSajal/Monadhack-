import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  if (typeof email !== "string" || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (hasBlob) {
    const key = `waitlist/${email.toLowerCase()}.txt`;
    await put(key, `${email} ${new Date().toISOString()}`, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!hasBlob) return NextResponse.json({ count: 0 });
  const { blobs } = await list({ prefix: "waitlist/" });
  return NextResponse.json({ count: blobs.length });
}
