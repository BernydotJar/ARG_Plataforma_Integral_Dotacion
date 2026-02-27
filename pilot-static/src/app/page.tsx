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

import { PortalShell } from "../components/layout/PortalShell";
import { PageHeader } from "../components/ui/PageHeader";
import type { AppUser, DashboardCard, PendingItem } from "../lib/types";

const demoUser: AppUser = {
  id: "pilot-user-001",
  name: "Usuario Demo",
  roles: ["SuperAdmin", "AdminLocal"],
  sedeIds: ["*"],
};

const cards: DashboardCard[] = [
  {
    id: "pedidos",
    title: "Dotación / Pedidos",
    description: "Solicitudes de dotación y aprobaciones",
    count: 1,
  },
  {
    id: "inventario",
    title: "Inventario",
    description: "Movimientos, ajustes y stock",
    count: 1,
  },
  {
    id: "calidad",
    title: "Calidad",
    description: "Inspecciones y defectos",
    count: 1,
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    description: "Tickets correctivos y preventivos",
    count: 1,
  },
];

const pendientes: PendingItem[] = [
  {
    id: "pending-ticket-001",
    tipo: "Ticket",
    titulo: "TM-2026-0001 - Transportador Principal",
    estado: "Abierto",
    fecha: "2026-02-26T23:26:47.000Z",
  },
];

export default function HomePage() {
  return (
    <PortalShell user={demoUser} activeKey="inicio">
      <div className="page-container">
        <PageHeader
          title="Inicio"
          description="Resumen operativo por módulos y pendientes del usuario"
        />

        <div className="card-grid four-col">
          {cards.map((card) => (
            <Card key={card.id} className="module-card dashboard-card-link" role="button" tabIndex={0}>
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

        <Card>
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
              {pendientes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>
                    <a href="#" aria-label={`Ver detalle de ${item.titulo}`}>
                      {item.titulo}
                    </a>
                  </TableCell>
                  <TableCell>{item.estado}</TableCell>
                  <TableCell>{new Date(item.fecha).toLocaleString("es-GT")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PortalShell>
  );
}
