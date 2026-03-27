"use client";

import { Badge, Button, Text } from "@fluentui/react-components";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
}

interface TourGeometry {
  highlight: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  card: {
    top: number;
    left: number;
    width: number;
  };
}

interface AppTourProps {
  pathname: string;
  userKey?: string;
  variant?: TourVariant;
  onClose: () => void;
}

export type TourVariant = "original" | "glass";

interface CardPlacement {
  top: number;
  left: number;
  width: number;
}

interface Rectangle {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOUR_VERSION = "2026.03.19-rfq";
const EDGE_GAP = 16;
const CARD_MIN_WIDTH = 316;
const CARD_MAX_WIDTH = 440;
const CARD_ESTIMATED_HEIGHT = 236;
const SPOTLIGHT_PADDING = 10;
const CARD_CLEARANCE = 18;

const shellSteps: TourStep[] = [
  {
    id: "nav-pedidos",
    target: '[data-tour="nav-pedidos"]',
    title: "Prioridad RFQ: Dotación / Pedidos",
    description:
      "Este es el flujo crítico del negocio: registrar entrega, seleccionar colaborador, confirmar prendas y dejar lista la trazabilidad para firma.",
  },
  {
    id: "nav-admin-usuarios",
    target: '[data-tour="nav-admin-usuarios"]',
    title: "Control de acceso por perfil",
    description:
      "Desde Admin Usuarios validas RBAC con los perfiles clave: Super Admin, Admin Local, Usuario Pedidos y UsuarioFinal (Colaborador).",
  },
  {
    id: "nav-integraciones",
    target: '[data-tour="nav-integraciones"]',
    title: "Confianza técnica: Integraciones",
    description:
      "La plataforma ya contempla integración empresarial con SFTP SuccessFactors y SAP, alineada al ecosistema operativo de ARGOS.",
  },
  {
    id: "nav-rag",
    target: '[data-tour="nav-rag"]',
    title: "Diferenciador: Asistente RAG",
    description:
      "Cierra la demostración con autoservicio guiado para resolver dudas operativas sin escalar a soporte en casos recurrentes.",
  },
];

const homeSteps: TourStep[] = [
  {
    id: "home-card-pedidos",
    target: '[data-tour="home-card-pedidos"]',
    title: "Entrada rápida al flujo crítico",
    description:
      "Desde esta tarjeta ingresas de forma directa al circuito de Dotación para ejecución y seguimiento diario.",
  },
  {
    id: "home-pendings",
    target: '[data-tour="home-pendientes"]',
    title: "Pendientes priorizados",
    description:
      "Aquí se concentran aprobaciones y tareas del usuario para operar con foco y tiempos de respuesta controlados.",
  },
];

const pedidosSteps: TourStep[] = [
  {
    id: "pedidos-filtros",
    target: '[data-tour="pedidos-filtros"]',
    title: "Bandeja operativa de Dotación",
    description:
      "Filtra por estado y texto para gestionar rápidamente solicitudes activas, aprobaciones y casos en seguimiento.",
  },
  {
    id: "pedidos-accion-principal",
    target: '[data-tour="page-header-action"]',
    title: "Registro de solicitud",
    description:
      "El Admin Local crea el pedido y asocia colaborador, contexto y detalle de prendas para iniciar el flujo formal.",
  },
  {
    id: "pedidos-tabla",
    target: '[data-tour="pedidos-tabla"]',
    title: "Trazabilidad hasta firma",
    description:
      "Cada fila consolida estado, prioridad y acceso al detalle para completar aprobación, entrega y evidencia de firma.",
  },
];

const inventarioSteps: TourStep[] = [
  {
    id: "inventario-contexto",
    target: '[data-tour="nav-inventario"]',
    title: "Soporte operativo complementario",
    description:
      "Inventario se mantiene integrado para continuidad operativa, sin desplazar el foco principal de Dotación en el RFQ.",
  },
];

const adminUsersSteps: TourStep[] = [
  {
    id: "usuarios-perfiles-rfq",
    target: '[data-tour="usuarios-perfiles-rfq"]',
    title: "Perfiles del RFQ",
    description:
      "La configuración presenta de forma explícita los cuatro perfiles solicitados para operación y gobierno de acceso.",
  },
  {
    id: "usuarios-matriz-rbac",
    target: '[data-tour="usuarios-matriz-rbac"]',
    title: "Matriz RBAC",
    description:
      "La matriz permite evidenciar alcance por usuario, roles asignados y restricción por sede de manera auditable.",
  },
];

const integracionesSteps: TourStep[] = [
  {
    id: "integraciones-placeholders",
    target: '[data-tour="integraciones-placeholders"]',
    title: "Conectores corporativos",
    description:
      "Se visualizan los conectores definidos para la propuesta: SFTP SuccessFactors, SAP y orquestación por flujos.",
  },
  {
    id: "integraciones-estado",
    target: '[data-tour="integraciones-estado"]',
    title: "Monitoreo y operación",
    description:
      "La vista de estado prepara al equipo para seguimiento de corridas, reprocesos controlados y trazabilidad técnica.",
  },
];

const calidadSteps: TourStep[] = [
  {
    id: "calidad-extension",
    target: '[data-tour="nav-calidad"]',
    title: "Capacidad extensible",
    description:
      "Calidad se mantiene como extensión de plataforma, sin desviar el alcance principal de Dotación en esta presentación.",
  },
];

const mantenimientoSteps: TourStep[] = [
  {
    id: "mantenimiento-extension",
    target: '[data-tour="nav-mantenimiento"]',
    title: "Capacidad extensible",
    description:
      "Mantenimiento también está habilitado como evolución natural del portal, manteniendo foco en el RFQ actual.",
  },
];

const ragSteps: TourStep[] = [
  {
    id: "rag-thread",
    target: '[data-tour="rag-thread"]',
    title: "Asesoría operativa guiada",
    description:
      "El asistente entrega diagnóstico y pasos de resolución para reducir tickets L1 y acelerar la ejecución en campo.",
  },
  {
    id: "rag-suggestions",
    target: '[data-tour="rag-suggestions"]',
    title: "Evidencia y autoservicio",
    description:
      "Las respuestas incluyen fuentes y preguntas sugeridas para que el usuario resuelva dudas sin depender de soporte.",
  },
];
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const intersectionArea = (a: Rectangle, b: Rectangle): number => {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return width * height;
};

const placeCardOriginal = (
  targetRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
  cardWidth: number,
): CardPlacement => {
  const spaceBelow = viewportHeight - targetRect.bottom;
  const showCardBelow = spaceBelow >= CARD_ESTIMATED_HEIGHT + 20;

  const cardTop = showCardBelow
    ? clamp(targetRect.bottom + 16, EDGE_GAP, viewportHeight - CARD_ESTIMATED_HEIGHT - EDGE_GAP)
    : clamp(targetRect.top - CARD_ESTIMATED_HEIGHT - 16, EDGE_GAP, viewportHeight - CARD_ESTIMATED_HEIGHT - EDGE_GAP);

  const cardLeft = clamp(
    targetRect.left + targetRect.width / 2 - cardWidth / 2,
    EDGE_GAP,
    viewportWidth - cardWidth - EDGE_GAP,
  );

  return {
    top: cardTop,
    left: cardLeft,
    width: cardWidth,
  };
};

const placeCardWithoutOverlap = (
  highlight: Rectangle,
  viewportWidth: number,
  viewportHeight: number,
  cardWidth: number,
  cardHeight: number,
): CardPlacement => {
  const centerX = highlight.left + highlight.width / 2;
  const centerY = highlight.top + highlight.height / 2;

  const rawCandidates = [
    { top: highlight.top + highlight.height + CARD_CLEARANCE, left: centerX - cardWidth / 2 },
    { top: highlight.top - cardHeight - CARD_CLEARANCE, left: centerX - cardWidth / 2 },
    { top: centerY - cardHeight / 2, left: highlight.left + highlight.width + CARD_CLEARANCE },
    { top: centerY - cardHeight / 2, left: highlight.left - cardWidth - CARD_CLEARANCE },
  ];

  const candidates = rawCandidates.map((candidate) => {
    const top = clamp(candidate.top, EDGE_GAP, viewportHeight - cardHeight - EDGE_GAP);
    const left = clamp(candidate.left, EDGE_GAP, viewportWidth - cardWidth - EDGE_GAP);
    const cardRect: Rectangle = { top, left, width: cardWidth, height: cardHeight };
    return {
      top,
      left,
      overlap: intersectionArea(cardRect, highlight),
    };
  });

  const perfect = candidates.find((candidate) => candidate.overlap === 0);
  if (perfect) {
    return {
      top: perfect.top,
      left: perfect.left,
      width: cardWidth,
    };
  }

  candidates.sort((a, b) => a.overlap - b.overlap);
  return {
    top: candidates[0].top,
    left: candidates[0].left,
    width: cardWidth,
  };
};

const getRouteSteps = (pathname: string): TourStep[] => {
  if (pathname === "/") return homeSteps;
  if (pathname.startsWith("/pedidos")) return pedidosSteps;
  if (pathname.startsWith("/admin/usuarios-roles")) return adminUsersSteps;
  if (pathname.startsWith("/admin/integraciones")) return integracionesSteps;
  if (pathname.startsWith("/inventario")) return inventarioSteps;
  if (pathname.startsWith("/calidad")) return calidadSteps;
  if (pathname.startsWith("/mantenimiento")) return mantenimientoSteps;
  if (pathname.startsWith("/asistente-rag")) return ragSteps;
  return [];
};

const getStepsForPath = (pathname: string): TourStep[] => [...shellSteps, ...getRouteSteps(pathname)];

export function AppTour({ pathname, userKey, onClose, variant = "original" }: AppTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [geometry, setGeometry] = useState<TourGeometry | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const hasDom = typeof document !== "undefined";

  const visibleSteps = useMemo(() => {
    const allSteps = getStepsForPath(pathname);
    if (!hasDom) return allSteps;

    return allSteps.filter((step) => Boolean(document.querySelector(step.target)));
  }, [hasDom, pathname]);

  const currentStep = visibleSteps[stepIndex] ?? null;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex >= visibleSteps.length - 1;
  const tourLabel = variant === "glass" ? "Tour ARGOS Glass" : "Tour ARGOS";

  useEffect(() => {
    if (!currentStep) return;

    const target = document.querySelector<HTMLElement>(currentStep.target);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    const updateGeometry = () => {
      const rect = target.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = clamp(Math.round(viewportWidth * 0.34), CARD_MIN_WIDTH, CARD_MAX_WIDTH);
      const cardHeight = Math.max(CARD_ESTIMATED_HEIGHT, cardRef.current?.offsetHeight || CARD_ESTIMATED_HEIGHT);

      const highlightTop = clamp(rect.top - SPOTLIGHT_PADDING, EDGE_GAP, viewportHeight - EDGE_GAP);
      const highlightLeft = clamp(rect.left - SPOTLIGHT_PADDING, EDGE_GAP, viewportWidth - EDGE_GAP);
      const highlightWidth = clamp(rect.width + SPOTLIGHT_PADDING * 2, 40, viewportWidth - EDGE_GAP * 2);
      const highlightHeight = clamp(rect.height + SPOTLIGHT_PADDING * 2, 40, viewportHeight - EDGE_GAP * 2);

      const highlightRect: Rectangle = {
        top: highlightTop,
        left: highlightLeft,
        width: highlightWidth,
        height: highlightHeight,
      };

      const card = variant === "glass"
        ? placeCardWithoutOverlap(highlightRect, viewportWidth, viewportHeight, cardWidth, cardHeight)
        : placeCardOriginal(rect, viewportWidth, viewportHeight, cardWidth);

      setGeometry({
        highlight: highlightRect,
        card,
      });
    };

    updateGeometry();
    const rafId = window.requestAnimationFrame(updateGeometry);
    window.addEventListener("resize", updateGeometry);
    window.addEventListener("scroll", updateGeometry, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateGeometry);
      window.removeEventListener("scroll", updateGeometry, true);
    };
  }, [currentStep, variant]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      const focusable = cardRef.current?.querySelector<HTMLElement>("button");
      focusable?.focus();
    }, 20);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [stepIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLastStep) {
          onClose();
        } else {
          setStepIndex((value) => Math.min(value + 1, visibleSteps.length - 1));
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((value) => Math.max(value - 1, 0));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isLastStep, onClose, visibleSteps.length]);

  if (!hasDom) return null;

  if (!visibleSteps.length) {
    return createPortal(
      <div className={`app-tour-layer app-tour-layer--${variant}`} aria-live="polite">
        <div className="app-tour-overlay" onClick={onClose} />
        <section
          className="app-tour-card"
          role="dialog"
          aria-modal="true"
          aria-label="Tour guiado de ARGOS"
          ref={cardRef}
          style={{
            top: "max(16px, calc(50% - 120px))",
            left: "max(16px, calc(50% - 210px))",
            width: "min(420px, calc(100vw - 32px))",
          }}
        >
          <div className="app-tour-card-header">
            <Badge appearance="tint" color="informative">
              {tourLabel}
            </Badge>
          </div>
          <Text as="h2" size={500} weight="semibold" block>
            No hay pasos disponibles en esta vista
          </Text>
          <Text className="muted-text" block>
            Cambia a Inicio o a un módulo principal y vuelve a ejecutar el tour.
          </Text>
          <div className="app-tour-actions">
            <span />
            <div className="app-tour-actions-right">
              <Button appearance="primary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </section>
      </div>,
      document.body,
    );
  }

  if (!currentStep || !geometry) return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

  const cutTop = Math.max(0, geometry.highlight.top);
  const cutLeft = Math.max(0, geometry.highlight.left);
  const cutRight = Math.min(viewportWidth, geometry.highlight.left + geometry.highlight.width);
  const cutBottom = Math.min(viewportHeight, geometry.highlight.top + geometry.highlight.height);

  const overlaySegments = [
    {
      key: "top",
      style: {
        top: 0,
        left: 0,
        width: "100%",
        height: cutTop,
      },
    },
    {
      key: "left",
      style: {
        top: cutTop,
        left: 0,
        width: cutLeft,
        height: Math.max(0, cutBottom - cutTop),
      },
    },
    {
      key: "right",
      style: {
        top: cutTop,
        left: cutRight,
        width: Math.max(0, viewportWidth - cutRight),
        height: Math.max(0, cutBottom - cutTop),
      },
    },
    {
      key: "bottom",
      style: {
        top: cutBottom,
        left: 0,
        width: "100%",
        height: Math.max(0, viewportHeight - cutBottom),
      },
    },
  ];

  const progress = Math.round(((stepIndex + 1) / visibleSteps.length) * 100);

  const handleNext = () => {
    if (isLastStep) {
      if (typeof window !== "undefined") {
        const payload = {
          reason: "completed",
          path: pathname,
          stepId: currentStep.id,
          at: new Date().toISOString(),
        };
        window.localStorage.setItem(`argos:tour:${TOUR_VERSION}:${variant}:${userKey || "anon"}`, JSON.stringify(payload));
      }
      onClose();
      return;
    }

    setStepIndex((value) => Math.min(value + 1, visibleSteps.length - 1));
  };

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      const payload = {
        reason: "dismissed",
        path: pathname,
        stepId: currentStep.id,
        at: new Date().toISOString(),
      };
      window.localStorage.setItem(`argos:tour:${TOUR_VERSION}:${variant}:${userKey || "anon"}`, JSON.stringify(payload));
    }

    onClose();
  };

  return createPortal(
    <div className={`app-tour-layer app-tour-layer--${variant}`} aria-live="polite">
      {overlaySegments.map((segment) => (
        <div
          key={segment.key}
          className="app-tour-overlay-segment"
          onClick={handleSkip}
          style={segment.style}
        />
      ))}

      <div
        className="app-tour-spotlight"
        style={{
          top: `${geometry.highlight.top}px`,
          left: `${geometry.highlight.left}px`,
          width: `${geometry.highlight.width}px`,
          height: `${geometry.highlight.height}px`,
        }}
      />

      <section
        className="app-tour-card"
        role="dialog"
        aria-modal="true"
        aria-label="Tour guiado de ARGOS"
        ref={cardRef}
        style={{
          top: `${geometry.card.top}px`,
          left: `${geometry.card.left}px`,
          width: `${geometry.card.width}px`,
        }}
      >
        <div className="app-tour-card-header">
          <Badge appearance="tint" color="informative">
            {tourLabel}
          </Badge>
          <Button appearance="subtle" size="small" onClick={handleSkip}>
            Cerrar
          </Button>
        </div>

        <Text as="h2" size={500} weight="semibold" block>
          {currentStep.title}
        </Text>

        <Text className="muted-text" block>
          {currentStep.description}
        </Text>

        <div className="app-tour-progress-row">
          <Text size={200} className="muted-text">
            Paso {stepIndex + 1} de {visibleSteps.length}
          </Text>
          <div className="app-tour-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="app-tour-actions">
          <Button appearance="subtle" onClick={() => setStepIndex((value) => Math.max(value - 1, 0))} disabled={isFirstStep}>
            Anterior
          </Button>
          <div className="app-tour-actions-right">
            <Button appearance="secondary" onClick={handleSkip}>
              Omitir
            </Button>
            <Button appearance="primary" onClick={handleNext}>
              {isLastStep ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
