"use client";

import {
  Badge,
  Button,
  Card,
  Skeleton,
  SkeletonItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { CalendarClock24Regular, Search24Regular } from "@fluentui/react-icons";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTimeGt } from "@/lib/format/date";
import { apiFetch, ApiRequestError } from "@/lib/http/client";
import type { DashboardCard, PendingItem } from "@/lib/types/app";

const PlantWorkerHero = dynamic(
  () => import("@/components/home/PlantWorkerHero").then((module) => module.PlantWorkerHero),
  { ssr: false },
);

type DashboardResponse = {
  cards: DashboardCard[];
  pendientes: PendingItem[];
  runtimeMode: "demo" | "api";
};

type DashboardCacheEntry = {
  ts: number;
  payload: DashboardResponse;
};

const DASHBOARD_CACHE_KEY = "argos:dashboard:v1";
const DASHBOARD_CACHE_TTL_MS = 45_000;

const HOME_CARD_TOUR_TARGET: Record<string, string> = {
  "/pedidos": "home-card-pedidos",
  "/inventario": "home-card-inventario",
  "/calidad": "home-card-calidad",
  "/mantenimiento": "home-card-mantenimiento",
};

const readDashboardCache = (): DashboardResponse | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DashboardCacheEntry;
    if (!parsed?.payload || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > DASHBOARD_CACHE_TTL_MS) return null;

    return parsed.payload;
  } catch {
    return null;
  }
};

const writeDashboardCache = (payload: DashboardResponse): void => {
  if (typeof window === "undefined") return;

  const entry: DashboardCacheEntry = {
    ts: Date.now(),
    payload,
  };

  try {
    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore cache persistence errors.
  }
};

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;

    try {
      if (!background) {
        setLoading(true);
      }
      setError(null);
      const payload = await apiFetch<DashboardResponse>("/api/dashboard");
      setData(payload);
      writeDashboardCache(payload);
    } catch (err) {
      if (!background) {
        setError(err instanceof ApiRequestError ? err.message : "Error al cargar dashboard");
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cached = readDashboardCache();

    if (cached) {
      setData(cached);
      setLoading(false);
      void loadDashboard({ background: true });
      return;
    }

    void loadDashboard();
  }, [loadDashboard]);

  const navigateToCard = (href: string) => {
    router.push(href);
  };

  const onCardKeyDown =
    (href: string) =>
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigateToCard(href);
    };

  return (
    <div className="page-container">
      <PageHeader
        title="Inicio"
        description="Resumen operativo por módulos y pendientes del usuario"
      />

      {!loading ? <PlantWorkerHero /> : null}

      {loading ? (
        <>
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={`dashboard-card-skeleton-${index}`} className="module-card">
                <Skeleton>
                  <div className="skeleton-stack">
                    <SkeletonItem size={20} />
                    <SkeletonItem size={16} />
                  </div>
                </Skeleton>
              </Card>
            ))}
          </div>
          <Card>
            <Skeleton>
              <div className="skeleton-stack">
                <SkeletonItem size={20} />
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonItem key={`pending-skeleton-${index}`} size={16} />
                ))}
              </div>
            </Skeleton>
          </Card>
        </>
      ) : null}

      {error ? (
        <Card>
          <Text weight="semibold">No se pudo cargar el dashboard</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void loadDashboard()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      {!loading && data ? (
        <>
          <div className="card-grid four-col" data-tour="home-cards">
            {data.cards.map((card) => (
              <Card
                key={card.id}
                className="module-card dashboard-card-link"
                role="link"
                tabIndex={0}
                data-tour={HOME_CARD_TOUR_TARGET[card.href]}
                onClick={() => navigateToCard(card.href)}
                onKeyDown={onCardKeyDown(card.href)}
              >
                <div className="module-card-title-row">
                  <Text weight="semibold">{card.title}</Text>
                  <Badge appearance="filled">{card.count}</Badge>
                </div>
                <Text size={300} className="muted-text">
                  {card.description}
                </Text>
              </Card>
            ))}
          </div>

          <Card data-tour="home-pendientes">
            <div className="module-card-title-row">
              <Text weight="semibold">Mis pendientes</Text>
              <Badge appearance={data.runtimeMode === "demo" ? "outline" : "filled"}>
                Modo {data.runtimeMode === "demo" ? "Demo" : "API"}
              </Badge>
            </div>
            <div className="table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Título</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendientes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.tipo}</TableCell>
                      <TableCell>
                        <Button as="a" href={item.href} appearance="secondary" className="touch-action-button">
                          {item.titulo}
                        </Button>
                      </TableCell>
                      <TableCell>{item.estado}</TableCell>
                      <TableCell>{formatDateTimeGt(item.fecha)}</TableCell>
                    </TableRow>
                  ))}
                  {data.pendientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="table-empty-cell">
                        <EmptyState
                          compact
                          icon={<CalendarClock24Regular fontSize={32} />}
                          title="No hay pendientes"
                          description="Cuando existan aprobaciones o tareas abiertas aparecerán aquí."
                          action={(
                            <Button appearance="secondary" icon={<Search24Regular />} onClick={() => void loadDashboard()}>
                              Actualizar
                            </Button>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
