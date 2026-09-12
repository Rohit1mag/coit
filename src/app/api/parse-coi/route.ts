import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { parseStorageObject } from "@/lib/parse-coi";

export const maxDuration = 60;
export const runtime = "nodejs";

const bodySchema = z.object({
  path: z.string().min(1),
  vendor_id: z.string().uuid().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email(),
  trade: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();

    const json = await request.json();
    const body = bodySchema.parse(json);

    if (!body.path.startsWith(`${session.org.id}/`)) {
      return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    }

    const result = await parseStorageObject({
      orgId: session.org.id,
      path: body.path,
      vendorId: body.vendor_id,
      vendorName: body.vendor_name,
      contactName: body.contact_name,
      contactEmail: body.contact_email,
      trade: body.trade,
    });

    return NextResponse.json({
      vendor_id: result.vendorId,
      document: result.document,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to parse COI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
