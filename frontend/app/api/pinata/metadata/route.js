import { NextResponse } from "next/server";

export const runtime = "nodejs";

// If the seeded placeholder CID is broken, swap it with a real one from env.
// Set FALLBACK_IMAGE_CID in frontend/.env.local after uploading an image to Pinata.
const BROKEN_PLACEHOLDER = "bafybeibwzifw52ttrkqlikfzext5jzk4v4tqfordplseeyha5yaq5b5bq";

// GET ?cid=<cid>          → JSON metadata (proxied)
// GET ?cid=<cid>&raw=1     → binary stream (used for images)
export async function GET(req) {
  // Read env at request time so .env changes pick up on hot reload.
  const GATEWAY = (process.env.PINATA_GATEWAY ?? "").trim();
  const FALLBACK_IMAGE_CID = (process.env.FALLBACK_IMAGE_CID ?? "").trim() || null;

  const { searchParams } = new URL(req.url);
  let cid = searchParams.get("cid");
  const raw = searchParams.get("raw");
  if (!cid) {
    return NextResponse.json({ error: "Missing 'cid'" }, { status: 400 });
  }
  if (!GATEWAY) {
    return NextResponse.json(
      { error: "PINATA_GATEWAY not configured on server" },
      { status: 500 }
    );
  }

  // Strip ipfs:// prefix if present.
  cid = cid.replace(/^ipfs:\/\//, "");

  // Short-circuit: if someone is requesting the broken placeholder image
  // directly (with raw=1) and we have a fallback, redirect to the fallback CID.
  if (raw && FALLBACK_IMAGE_CID && cid === BROKEN_PLACEHOLDER) {
    console.log(`[pinata-proxy] swapping image ${cid} → ${FALLBACK_IMAGE_CID}`);
    cid = FALLBACK_IMAGE_CID;
  }

  const url = `https://${GATEWAY}/ipfs/${cid}`;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Gateway responded ${res.status}` },
        { status: res.status }
      );
    }
    const ct = res.headers.get("content-type") ?? "application/octet-stream";

    if (raw) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "content-type": ct,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (ct.includes("application/json") || ct.includes("text/plain")) {
      const data = await res.json().catch(async () => {
        const t = await res.text();
        return JSON.parse(t);
      });
      // Patch broken placeholder image CID with a real one if configured.
      if (
        FALLBACK_IMAGE_CID &&
        typeof data?.image === "string" &&
        data.image.includes(BROKEN_PLACEHOLDER)
      ) {
        console.log(
          `[pinata-proxy] patching metadata image ${data.image} → ipfs://${FALLBACK_IMAGE_CID}`
        );
        data.image = `ipfs://${FALLBACK_IMAGE_CID}`;
      } else if (typeof data?.image === "string") {
        console.log(
          `[pinata-proxy] metadata image kept as-is: ${data.image} (fallback set: ${Boolean(FALLBACK_IMAGE_CID)})`
        );
      }
      return NextResponse.json(data, {
        headers: {
          // Don't cache forever if we patched — image may still be updating.
          "cache-control": FALLBACK_IMAGE_CID
            ? "public, max-age=3600"
            : "public, max-age=31536000, immutable",
        },
      });
    }

    // Non-JSON — treat as opaque blob.
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "content-type": ct },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Gateway fetch failed" },
      { status: 502 }
    );
  }
}
