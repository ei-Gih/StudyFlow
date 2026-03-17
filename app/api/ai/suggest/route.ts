// app/api/ai/suggest/route.ts
import { NextRequest } from "next/server";
import { ok, unauthorized, serverError, requireAuth } from "@/lib/utils";
import { generateSuggestions } from "@/lib/ai-suggest";

// GET /api/ai/suggest?minutes=30
// Retorna sugestões de estudo ordenadas por prioridade
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const minutes = Math.min(
    480,
    Math.max(5, Number(req.nextUrl.searchParams.get("minutes") ?? 30))
  );

  try {
    const suggestions = await generateSuggestions({
      userId: user.id,
      availableMinutes: minutes,
    });

    return ok({ suggestions });
  } catch {
    return serverError();
  }
}
