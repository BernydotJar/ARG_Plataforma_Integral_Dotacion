"use client";

import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { KeyboardEvent } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTimeGt } from "@/lib/format/date";
import { dashboardCards, pendingItems } from "@/lib/mock-data";

const PlantWorkerHero = dynamic(
  () => import("@/components/home/PlantWorkerHero").then((module) => module.PlantWorkerHero),
  { ssr: false },
);

const HOME_CARD_TOUR_TARGET: Record<string, string> = {
  "/pedidos": "home-card-pedidos",
  "/inventario": "home-card-inventario",
  "/calidad": "home-card-calidad",
  "/mantenimiento": "home-card-mantenimiento",
};

export default function HomePage() {
  const router = useRouter();

  const onCardKeyDown =
    (href: string) =>
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      router.push(href);
    };

  return (
    <div className="page-container">
      <PageHeader
        title="Inicio"
        description="Resumen operativo por módulos y pendientes del usuario"
      />

      <PlantWorkerHero />

      <div className="card-grid four-col" data-tour="home-cards">
        {dashboardCards.map((card) => (
          <Card
            key={card.id}
            className="module-card dashboard-card-link"
            role="link"
            tabIndex={0}
            data-tour={HOME_CARD_TOUR_TARGET[card.href]}
            onClick={() => router.push(card.href)}
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
          <Badge appearance="outline">Modo Demo</Badge>
        </div>
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
            {pendingItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>
                  <a href={item.href} aria-label={`Ver detalle de ${item.titulo}`}>
                    {item.titulo}
                  </a>
                </TableCell>
                <TableCell>{item.estado}</TableCell>
                <TableCell>{formatDateTimeGt(item.fecha)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
