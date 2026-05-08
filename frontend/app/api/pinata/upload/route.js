import { NextResponse } from "next/server";
import { pinata } from "@/lib/pinata";

export const runtime = "nodejs";

// POST: multipart/form-data with `file` (image upload) → returns { cid }.
// POST: application/json body → pins JSON, returns { cid }.
export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      const result = await pinata.upload.public.json(json);
      return NextResponse.json({ cid: result.cid });
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "Missing 'file' field" },
          { status: 400 }
        );
      }
      const result = await pinata.upload.public.file(file);
      return NextResponse.json({ cid: result.cid });
    }

    return NextResponse.json(
      { error: "Unsupported content-type" },
      { status: 415 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Pinata upload failed" },
      { status: 500 }
    );
  }
}
