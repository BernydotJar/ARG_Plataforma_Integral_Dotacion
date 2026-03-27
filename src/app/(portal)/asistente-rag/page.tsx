"use client";

import {
  Badge,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Text,
} from "@fluentui/react-components";
import {
  ArrowReset24Regular,
  BrainCircuit24Regular,
  Chat24Regular,
  Send24Regular,
} from "@fluentui/react-icons";
import { FormEvent, useMemo, useRef, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { RagChatMessageInput, RagChatResponse, RagModuleScope, RagSource } from "@/lib/rag/types";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  confidence?: number;
  suggestions?: string[];
  outOfScope?: boolean;
};

const moduleOptions: RagModuleScope[] = [
  "Todos",
  "General",
  "Dotacion",
  "Inventario",
  "Calidad",
  "Mantenimiento",
  "Integraciones",
  "Seguridad",
];

const moduleLabels: Record<RagModuleScope, string> = {
  Todos: "Todos los modulos",
  General: "General",
  Dotacion: "Dotacion / Pedidos",
  Inventario: "Inventario",
  Calidad: "Calidad",
  Mantenimiento: "Mantenimiento",
  Integraciones: "Integraciones",
  Seguridad: "Seguridad",
};

const quickQuestions = [
  "¿Cuál es el flujo recomendado de un pedido de dotación?",
  "¿En qué estado puedo enviar un pedido a SAP?",
  "¿Qué validaciones debo completar antes de enviar un pedido aprobado a SAP para evitar rechazos?",
  "Tengo un pedido en EnAprobación por más de 24 horas, ¿qué reviso antes de escalar?",
  "El ajuste de inventario no actualiza stock, ¿qué validaciones debo hacer?",
  "Una inspección salió No conforme, ¿cuál es el protocolo de cierre?",
  "Un ticket de mantenimiento sigue Abierto, ¿cómo defino si escalo?",
];

const createMessageId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const initialAssistantMessage: UiMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Soy el asistente operativo de ARGOS. Te doy diagnostico, pasos de resolucion, validaciones y criterios de escalamiento para que puedas resolver en primer nivel sin depender de soporte.",
  suggestions: quickQuestions,
};

export default function AsistenteRagPage() {
  const [messages, setMessages] = useState<UiMessage[]>([initialAssistantMessage]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [moduleScope, setModuleScope] = useState<RagModuleScope>("Todos");
  const [error, setError] = useState<string | null>(null);

  const threadBottomRef = useRef<HTMLDivElement | null>(null);

  const lastAssistant = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find((entry) => entry.role === "assistant");
  }, [messages]);

  const scrollThreadToBottom = () => {
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const sendQuestion = async (forcedQuestion?: string) => {
    const question = (forcedQuestion ?? draft).trim();
    if (!question || loading) return;

    const nextUserMessage: UiMessage = {
      id: createMessageId(),
      role: "user",
      content: question,
    };

    const historyPayload: RagChatMessageInput[] = messages
      .slice(-8)
      .map((entry) => ({ role: entry.role, content: entry.content }));

    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");
    setError(null);
    setLoading(true);
    window.setTimeout(scrollThreadToBottom, 40);

    try {
      const response = await apiFetch<RagChatResponse>("/api/rag/chat", {
        method: "POST",
        body: JSON.stringify({
          query: question,
          moduleScope,
          history: historyPayload,
        }),
      });

      const assistantMessage: UiMessage = {
        id: createMessageId(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        suggestions: response.suggestions,
        outOfScope: response.outOfScope,
      };

      setMessages((current) => [...current, assistantMessage]);
      window.setTimeout(scrollThreadToBottom, 40);
    } catch (requestError) {
      const message = requestError instanceof ApiRequestError
        ? requestError.message
        : "No se pudo consultar el asistente en este momento.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: `No pude completar la consulta: ${message}`,
          outOfScope: true,
          suggestions: quickQuestions,
        },
      ]);
      window.setTimeout(scrollThreadToBottom, 40);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion();
  };

  const resetConversation = () => {
    setMessages([initialAssistantMessage]);
    setDraft("");
    setError(null);
    setLoading(false);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Asistente Operativo"
        description="RAG con guias expertas de resolucion y criterios de escalamiento"
      />

      <div className="rag-layout" data-tour="rag-layout">
        <Card className="rag-chat-card" data-tour="rag-thread">
          <div className="module-card-title-row">
            <Text weight="semibold">Conversacion</Text>
            <div className="actions-row">
              <Badge appearance="tint" color="informative">Asistente L1</Badge>
              <Button appearance="subtle" icon={<ArrowReset24Regular />} onClick={resetConversation}>
                Limpiar
              </Button>
            </div>
          </div>

          <div className="rag-thread">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rag-message rag-message-${message.role}`}
                role="article"
                aria-label={message.role === "assistant" ? "Respuesta del asistente" : "Pregunta del usuario"}
              >
                <div className="rag-message-header">
                  <Text weight="semibold">
                    {message.role === "assistant" ? "Asistente" : "Tu"}
                  </Text>
                  {message.role === "assistant" && typeof message.confidence === "number" ? (
                    <Badge appearance="outline" color={message.confidence >= 0.5 ? "success" : "warning"}>
                      Confianza {Math.round(message.confidence * 100)}%
                    </Badge>
                  ) : null}
                </div>
                <Text className="rag-message-content" block>
                  {message.content}
                </Text>

                {message.sources && message.sources.length > 0 ? (
                  <div className="rag-source-list">
                    {message.sources.map((source, index) => (
                      <div key={`${message.id}-${source.id}`} className="rag-source-item">
                        <Text size={200} weight="semibold" block>
                          [{index + 1}] {source.title}
                        </Text>
                        <Text size={200} className="muted-text" block>
                          {source.module} • score {source.score.toFixed(2)}
                        </Text>
                        <Text size={200} block>
                          {source.snippet}
                        </Text>
                      </div>
                    ))}
                  </div>
                ) : null}

                {message.suggestions && message.suggestions.length > 0 ? (
                  <div className="rag-chip-list">
                    {message.suggestions.slice(0, 3).map((suggestion) => (
                      <Button
                        key={`${message.id}-${suggestion}`}
                        appearance="secondary"
                        size="small"
                        onClick={() => void sendQuestion(suggestion)}
                        disabled={loading}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="rag-loading-row" aria-live="polite">
                <Spinner size="tiny" />
                <Text size={200}>Recuperando contexto y redactando respuesta...</Text>
              </div>
            ) : null}

            <div ref={threadBottomRef} />
          </div>

          <form className="rag-compose" onSubmit={onSubmit}>
            <Field label="Pregunta">
              <Input
                value={draft}
                onChange={(_, data) => setDraft(data.value)}
                placeholder="Ejemplo: En que estado puedo enviar un pedido a SAP?"
                disabled={loading}
              />
            </Field>

            <Field label="Contexto de recuperacion" data-tour="rag-scope">
              <Dropdown
                value={moduleLabels[moduleScope]}
                selectedOptions={[moduleScope]}
                onOptionSelect={(_, data) => setModuleScope((data.optionValue as RagModuleScope) || "Todos")}
                disabled={loading}
              >
                {moduleOptions.map((option) => (
                  <Option key={option} value={option}>{moduleLabels[option]}</Option>
                ))}
              </Dropdown>
            </Field>

            <div className="actions-row">
              <Button
                appearance="primary"
                icon={<Send24Regular />}
                type="submit"
                disabled={loading || !draft.trim()}
              >
                {loading ? "Consultando..." : "Preguntar"}
              </Button>
              <Button appearance="secondary" icon={<BrainCircuit24Regular />} onClick={() => void sendQuestion(quickQuestions[0])} disabled={loading}>
                Ejemplo experto
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rag-sidebar" data-tour="rag-suggestions">
          <Text weight="semibold">Capacidades del asistente</Text>
          <div className="rag-capability-list">
            <Text size={200}>- Diagnostico operativo basado en casos recurrentes.</Text>
            <Text size={200}>- Pasos concretos de resolucion por modulo.</Text>
            <Text size={200}>- Validaciones de cierre en sitio.</Text>
            <Text size={200}>- Criterios para evitar escalamiento innecesario.</Text>
            <Text size={200}>- Escalamiento dirigido cuando existe bloqueo real.</Text>
          </div>

          <Text weight="semibold">Preguntas sugeridas</Text>
          <div className="rag-chip-list">
            {quickQuestions.map((question) => (
              <Button key={question} appearance="secondary" icon={<Chat24Regular />} onClick={() => void sendQuestion(question)} disabled={loading}>
                {question}
              </Button>
            ))}
          </div>

          <Text weight="semibold">Ultima recuperacion</Text>
          {lastAssistant?.sources && lastAssistant.sources.length > 0 ? (
            <div className="rag-source-list">
              {lastAssistant.sources.map((source) => (
                <div key={`side-${source.id}`} className="rag-source-item">
                  <Text size={200} weight="semibold">{source.title}</Text>
                  <Text size={200} className="muted-text">{source.module} • {source.score.toFixed(2)}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text size={200} className="muted-text">Aun no hay fuentes recuperadas.</Text>
          )}

          {error ? <Text className="error-text" aria-live="assertive">{error}</Text> : null}
        </Card>
      </div>
    </div>
  );
}
