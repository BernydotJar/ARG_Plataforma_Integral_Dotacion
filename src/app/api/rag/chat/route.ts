import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/http/route";
import { runRagDemo } from "@/lib/rag/engine";
import type { RagChatMessageInput, RagChatRequest, RagModuleScope } from "@/lib/rag/types";

const sanitizeHistory = (history: RagChatRequest["history"]): RagChatMessageInput[] => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry): entry is RagChatMessageInput =>
      Boolean(entry)
      && (entry.role === "user" || entry.role === "assistant")
      && typeof entry.content === "string"
      && entry.content.trim().length > 0,
    )
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim(),
    }));
};

const sanitizeScope = (scope: unknown): RagModuleScope => {
  if (typeof scope !== "string") return "Todos";

  const allowed: RagModuleScope[] = [
    "Todos",
    "General",
    "Dotacion",
    "Inventario",
    "Calidad",
    "Mantenimiento",
    "Integraciones",
    "Seguridad",
  ];

  return allowed.includes(scope as RagModuleScope) ? (scope as RagModuleScope) : "Todos";
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const payload = await readJson<Partial<RagChatRequest>>(request);
    const query = String(payload.query || "").trim();

    if (!query) {
      return jsonError("La pregunta es requerida", 400);
    }

    const response = runRagDemo({
      query,
      moduleScope: sanitizeScope(payload.moduleScope),
      history: sanitizeHistory(payload.history),
      user: auth.user,
    });

    return jsonOk(response);
  } catch (error) {
    return jsonError("No se pudo generar respuesta RAG", 500, error instanceof Error ? error.message : undefined);
  }
}
