import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "Blob token not configured" }, { status: 500 });

  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "圖片太大，請壓縮後再上傳（上限 4MB）" }, { status: 413 });
    }
  } catch {}

  let file: File;
  try {
    const formData = await request.formData();
    const f = formData.get("file");
    if (!f || typeof f === "string") return NextResponse.json({ error: "No file" }, { status: 400 });
    file = f;
  } catch {
    return NextResponse.json({ error: "無法讀取上傳的檔案，圖片可能太大（上限 4MB）" }, { status: 413 });
  }

  try {
    const ext = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0]?.toLowerCase() ?? "";
    const base = file.name
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")
      .toLowerCase() || "image";
    const safeName = base + ext;
    const blob = await put(`articles/${Date.now()}-${safeName}`, file, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json({ error: (err as Error).message ?? "上傳失敗" }, { status: 500 });
  }
}
