"use client";

import { Badge, Card, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text } from "@fluentui/react-components";

import { PageHeader } from "@/components/ui/PageHeader";
import { availableRoles, sampleUsers } from "@/lib/mock-data";

const rfqProfiles = [
  "SuperAdmin",
  "AdminLocal",
  "UsuarioPedidos",
  "UsuarioFinal (Colaborador)",
];

export default function UsuariosRolesPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Administración de usuarios y roles"
        description="Matriz de accesos por perfil y alcance por sede"
      />

      <Card data-tour="usuarios-perfiles-rfq">
        <Text weight="semibold">Perfiles clave del RFQ</Text>
        <div className="badge-wrap">
          {rfqProfiles.map((role) => (
            <Badge key={role} appearance="tint" color="informative">
              {role}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <Text weight="semibold">Roles disponibles</Text>
        <div className="badge-wrap">
          {availableRoles.map((role) => (
            <Badge key={role} appearance="outline">
              {role}
            </Badge>
          ))}
        </div>
      </Card>

      <Card data-tour="usuarios-matriz-rbac">
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Usuario</TableHeaderCell>
                <TableHeaderCell>Correo</TableHeaderCell>
                <TableHeaderCell>Roles</TableHeaderCell>
                <TableHeaderCell>Sedes</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleUsers.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.nombre}</TableCell>
                  <TableCell>{entry.correo}</TableCell>
                  <TableCell>{entry.roles.join(", ")}</TableCell>
                  <TableCell>{entry.sedes.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
