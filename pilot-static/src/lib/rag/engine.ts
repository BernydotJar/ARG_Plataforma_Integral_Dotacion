import { ragKnowledgeBase } from "@/lib/rag/knowledge-base";
import type {
  RagChatMessageInput,
  RagChatResponse,
  RagEngineInput,
  RagKnowledgeChunk,
  RagModuleScope,
  RagSource,
} from "@/lib/rag/types";

const STOP_WORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "y", "o", "que", "como", "para", "con", "sin",
  "en", "por", "del", "al", "se", "es", "sobre", "me", "mi", "tu", "su", "lo", "le", "les",
  "ya", "hay", "puede", "puedo", "cual", "cuales", "cuando", "donde", "porque", "esto", "esta",
]);

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const isScopeCompatible = (chunk: RagKnowledgeChunk, moduleScope: RagModuleScope): boolean =>
  moduleScope === "Todos" || chunk.module === moduleScope;

const hasQueryOverlap = (chunk: RagKnowledgeChunk, queryTokens: string[]): boolean => {
  if (!queryTokens.length) return false;

  const haystack = normalizeText(`${chunk.title} ${chunk.content} ${chunk.tags.join(" ")}`);
  return queryTokens.some((token) => haystack.includes(token));
};

const scoreChunk = (
  chunk: RagKnowledgeChunk,
  queryTokens: string[],
  historyTokens: string[],
  moduleScope: RagModuleScope,
): number => {
  const chunkTokens = tokenize(`${chunk.title} ${chunk.content} ${chunk.tags.join(" ")}`);
  const queryHits = queryTokens.filter((token) => chunkTokens.includes(token)).length;
  const historyHits = historyTokens.filter((token) => chunkTokens.includes(token)).length;

  const tagHits = chunk.tags.filter((tag) => {
    const normalizedTag = normalizeText(tag);
    return queryTokens.some((token) => normalizedTag.includes(token));
  }).length;

  const lexicalMatchCount = queryHits + tagHits;

  let score = queryHits * 3 + historyHits * 0.8 + tagHits * 1.5;

  if (isScopeCompatible(chunk, moduleScope)) {
    score += moduleScope === "Todos" ? 0.2 : lexicalMatchCount > 0 ? 1.2 : 0.1;
  } else {
    score -= 1.2;
  }

  if (queryTokens.some((token) => normalizeText(chunk.module).includes(token))) {
    score += 0.9;
  }

  if (chunk.operationalGuidance) {
    score += 0.4;
  }

  if (queryTokens.length > 0 && lexicalMatchCount === 0) {
    score -= 1.4;
  }

  return Number(Math.max(0, score).toFixed(3));
};

const pickSnippet = (chunk: RagKnowledgeChunk, queryTokens: string[]): string => {
  const sentences = chunk.content.split(/[.!?]\s+/).filter(Boolean);

  let bestSentence = sentences[0] || chunk.content;
  let bestScore = -1;

  for (const sentence of sentences) {
    const sentenceTokens = tokenize(sentence);
    const score = queryTokens.filter((token) => sentenceTokens.includes(token)).length;

    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }

  return bestSentence.length > 180 ? `${bestSentence.slice(0, 177)}...` : bestSentence;
};

const buildSuggestions = (sources: RagKnowledgeChunk[], query: string): string[] => {
  const normalizedQuery = normalizeText(query);

  const suggestions = unique(
    sources.flatMap((source) => source.sampleQuestions),
  ).filter((question) => normalizeText(question) !== normalizedQuery);

  return suggestions.slice(0, 5);
};

const buildOutOfScopeResponse = (moduleScope: RagModuleScope): RagChatResponse => ({
  answer:
    "No encontre evidencia suficiente para responder con precision operativa. Incluye modulo, estado actual, accion que intentabas y mensaje observado para darte una guia resolutiva.",
  outOfScope: true,
  confidence: 0.18,
  sources: [],
  suggestions: [
    "¿Cuál es el flujo recomendado de un pedido de dotación?",
    "¿En qué estado puedo enviar un pedido a SAP?",
    "¿Qué validaciones debo completar antes de enviar un pedido aprobado a SAP para evitar rechazos?",
  ],
  moduleScope,
  retrievedAt: new Date().toISOString(),
});

const pickPrimaryDiagnosis = (topChunks: RagKnowledgeChunk[]): string => {
  for (const chunk of topChunks) {
    if (chunk.operationalGuidance?.diagnosis) {
      return chunk.operationalGuidance.diagnosis;
    }
  }

  return "No se detecta bloqueo critico; procede con validacion operativa guiada.";
};

const collectGuidance = (
  topChunks: RagKnowledgeChunk[],
  field: "actions" | "validations" | "preventEscalation" | "escalateWhen",
): string[] => {
  return unique(
    topChunks.flatMap((chunk) => chunk.operationalGuidance?.[field] ?? []),
  );
};

const buildAnswer = (
  query: string,
  moduleScope: RagModuleScope,
  history: RagChatMessageInput[],
  sources: Array<{ chunk: RagKnowledgeChunk; score: number }>,
  confidence: number,
  sessionSummary?: string,
): RagChatResponse => {
  const top = sources.slice(0, 3);
  if (!top.length) {
    return buildOutOfScopeResponse(moduleScope);
  }

  const sourcePayload: RagSource[] = top.map(({ chunk, score }) => ({
    id: chunk.id,
    title: chunk.title,
    module: chunk.module,
    score: Number(score.toFixed(3)),
    snippet: pickSnippet(chunk, tokenize(query)),
  }));

  const topChunks = top.map((entry) => entry.chunk);
  const diagnosis = pickPrimaryDiagnosis(topChunks);
  const actions = collectGuidance(topChunks, "actions").slice(0, 6);
  const validations = collectGuidance(topChunks, "validations").slice(0, 5);
  const preventEscalation = collectGuidance(topChunks, "preventEscalation").slice(0, 4);
  const escalateWhen = collectGuidance(topChunks, "escalateWhen").slice(0, 4);

  const actionBlock = actions.length
    ? actions.map((step, index) => `${index + 1}. ${step}`).join("\n")
    : sourcePayload.map((source, index) => `${index + 1}. ${source.snippet}`).join("\n");

  const validationBlock = validations.length
    ? validations.map((item) => `- ${item}`).join("\n")
    : "- Validar estado final y trazabilidad en historial.";

  const preventEscalationBlock = preventEscalation.length
    ? preventEscalation.map((item) => `- ${item}`).join("\n")
    : "- Documentar bien el caso para evitar reprocesos.";

  const escalationBlock = escalateWhen.length
    ? escalateWhen.map((item) => `- ${item}`).join("\n")
    : "- Escalar si hay error recurrente despues de reintento controlado.";

  const sourceBlock = sourcePayload
    .map((source, index) => `- [${index + 1}] ${source.title} (${source.module})`)
    .join("\n");

  const historyHint = history.length > 0
    ? "\nContinuidad aplicada: tome en cuenta el hilo conversacional reciente."
    : "";

  const sessionHint = sessionSummary ? `\nContexto de sesion: ${sessionSummary}.` : "";

  return {
    answer: [
      `Respuesta operativa para: \"${query}\"`,
      "",
      `Diagnostico probable: ${diagnosis}`,
      "",
      "Pasos recomendados en sitio:",
      actionBlock,
      "",
      "Validacion antes de cerrar:",
      validationBlock,
      "",
      "Para evitar escalamiento:",
      preventEscalationBlock,
      "",
      "Escalar a soporte solo si:",
      escalationBlock,
      "",
      "Fuentes consultadas:",
      sourceBlock,
      `${historyHint}${sessionHint}`.trim(),
    ].filter(Boolean).join("\n"),
    outOfScope: false,
    confidence,
    sources: sourcePayload,
    suggestions: buildSuggestions(topChunks, query),
    moduleScope,
    retrievedAt: new Date().toISOString(),
  };
};

export const runRagDemo = ({ query, moduleScope, history, user }: RagEngineInput): RagChatResponse => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return buildOutOfScopeResponse(moduleScope);
  }

  const queryTokens = tokenize(trimmedQuery);
  if (!queryTokens.length) {
    return buildOutOfScopeResponse(moduleScope);
  }

  const historyTokens = tokenize(history.slice(-4).map((entry) => entry.content).join(" "));

  const scored = ragKnowledgeBase
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, queryTokens, historyTokens, moduleScope),
      hasMatch: hasQueryOverlap(chunk, queryTokens),
    }))
    .filter((entry) => entry.score > 0.6 && entry.hasMatch)
    .sort((left, right) => right.score - left.score);

  const topScore = scored[0]?.score || 0;
  const confidence = Number(Math.min(0.94, Math.max(0.28, 0.28 + topScore / 14)).toFixed(2));

  const sessionSummary = user
    ? `${user.roles.join(", ")} | sedes ${user.sedeIds.join(", ")}`
    : undefined;

  return buildAnswer(trimmedQuery, moduleScope, history, scored, confidence, sessionSummary);
};
