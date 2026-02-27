"use client";

import { Card, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text } from "@fluentui/react-components";

import { PageHeader } from "@/components/ui/PageHeader";
import { catalogosData } from "@/lib/mock-data";

export default function CatalogosPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Administración de catálogos"
        description="Configuración base de sedes, áreas, ítems y maestros"
      />

      {Object.entries(catalogosData).map(([key, entries]) => (
        <Card key={key}>
          <Text weight="semibold">{key}</Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Nombre / Código</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.slice(0, 8).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.id}</TableCell>
                  <TableCell>{entry.nombre || entry.codigo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
