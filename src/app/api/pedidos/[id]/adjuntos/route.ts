import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/api-auth";
import {
  createPedidoAttachment,
  getPedidoDetail,
  listPedidoAttachments,
} from "@/lib/dataverse/repository";
import { jsonError, jsonOk } from "@/lib/http/route";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const createSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(1).max(120),
  contentBase64: z.string().trim().min(8),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const getDecodedBytes = (base64Value: string): number => {
  try {
    return Buffer.from(base64Value, "base64").byteLength;
  } catch {
    return 0;
  }
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const detail = await getPedidoDetail(auth.user, id);
    if (!detail) {
      return jsonError("Pedido no encontrado", 404);
    }

    const data = await listPedidoAttachments(auth.user, id);
    return jsonOk({ data });
  } catch (error) {
    return jsonError("No se pudieron listar los adjuntos", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser(request, ["SuperAdmin", "AdminLocal", "UsuarioPedidos", "UsuarioFinal"]);
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const detail = await getPedidoDetail(auth.user, id);
    if (!detail) {
      return jsonError("Pedido no encontrado", 404);
    }

    const payload = createSchema.parse(await request.json());

    if (!ALLOWED_MIME_TYPES.has(payload.mimeType)) {
      return jsonError("Tipo de archivo no permitido", 415);
    }

    const decodedBytes = getDecodedBytes(payload.contentBase64);
    if (!decodedBytes) {
      return jsonError("Archivo inválido", 400);
    }

    if (decodedBytes > MAX_ATTACHMENT_BYTES) {
      return jsonError("El archivo supera el máximo de 5 MB", 413);
    }

    const data = await createPedidoAttachment(auth.user, id, payload);
    return jsonOk({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Payload inválido", 400, error.message);
    }

    return jsonError("No se pudo cargar el adjunto", 500, error instanceof Error ? error.message : undefined);
  }
}
