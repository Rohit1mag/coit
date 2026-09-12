import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  alert_cadences: z.array(z.number().int().min(1).max(365)).min(1).max(8),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession();
    const body = bodySchema.parse(await request.json());
    const unique = [...new Set(body.alert_cadences)].sort((a, b) => b - a);

    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ alert_cadences: unique })
      .eq("id", session.org.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ alert_cadences: unique });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter at least one alert day between 1 and 365." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to save alerts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
