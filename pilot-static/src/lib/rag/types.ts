import type { AppUser } from "@/lib/types/app";

export const RAG_MODULES = [
  "General",
  "Dotacion",
  "Inventario",
  "Calidad",
  "Mantenimiento",
  "Integraciones",
  "Seguridad",
] as const;

export type RagModule = (typeof RAG_MODULES)[number];
export type RagModuleScope = RagModule | "Todos";

export interface RagOperationalGuidance {
  diagnosis: string;
  actions: string[];
  validations: string[];
  preventEscalation?: string[];
  escalateWhen?: string[];
}

export interface RagKnowledgeChunk {
  id: string;
  title: string;
  module: RagModule;
  content: string;
  tags: string[];
  sampleQuestions: string[];
  // Formato expert actual
  expertSummary?: string;
  selfServiceSteps?: string[];
  verifyChecklist?: string[];
  escalateIf?: string[];
  // Compatibilidad con formato previo
  operationalGuidance?: RagOperationalGuidance;
}

export interface RagChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface RagChatRequest {
  query: string;
  moduleScope?: RagModuleScope;
  history?: RagChatMessageInput[];
}

export interface RagSource {
  id: string;
  title: string;
  module: RagModule;
  snippet: string;
  score: number;
}

export interface RagChatResponse {
  answer: string;
  outOfScope: boolean;
  confidence: number;
  sources: RagSource[];
  suggestions: string[];
  moduleScope: RagModuleScope;
  retrievedAt: string;
}

export interface RagEngineInput {
  query: string;
  moduleScope: RagModuleScope;
  history: RagChatMessageInput[];
  user?: AppUser;
}
