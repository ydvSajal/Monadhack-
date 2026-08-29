import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const MAX = 5 * 1024 * 1024; // 5 MB per image

export async function POST(req: Request) {
  if (!hasBlob) {
    return NextResponse.json(
      { error: "Image upload is not configured (missing BLOB_READ_WRITE_TOKEN). Paste an image URL instead." },
      { status: 501 },
    );
  }

  const form = await req.formData().catch(() => null);
  const files = form?.getAll("file").filter((f): f is File => f instanceof File) ?? [];
  if (!files.length) return NextResponse.json({ error: "No file." }, { status: 400 });

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files." }, { status: 400 });
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: "Image over 5 MB." }, { status: 400 });
    }
    const ext = file.name.split(".").pop() || "png";
    const { url } = await put(`thumbs/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    urls.push(url);
  }
  return NextResponse.json({ urls });
}
