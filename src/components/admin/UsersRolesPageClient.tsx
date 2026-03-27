"use client";

import { Badge, Card, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text } from "@fluentui/react-components";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type UsersRolesResponse = {
  data: {
    availableRoles: string[];
    sampleUsers: Array<{
      id: string;
      nombre: string;
      correo: string;
      roles: string[];
      sedes: string[];
    }>;
  };
};

const rfqProfiles = [
  "SuperAdmin",
  "AdminLocal",
  "UsuarioPedidos",
  "UsuarioFinal (Colaborador)",
];

export function UsersRolesPageClient() {
  const [data, setData] = useState<UsersRolesResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<UsersRolesResponse>("/api/admin/usuarios-roles");
        setData(payload.data);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "No se pudo cargar usuarios/roles");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        title="Administración de usuarios y roles"
        description="Matriz de accesos por perfil y alcance por sede"
      />

      {loading ? <Spinner label="Cargando usuarios..." /> : null}
      {error ? <Text className="error-text">{error}</Text> : null}

      {data ? (
        <>
          <Card data-tour="usuarios-perfiles-rfq">
            <Text weight="semibold">Perfiles clave del RFQ</Text>
            <div className="badge-wrap">
              {rfqProfiles.map((role) => (
                <Badge key={role} appearance="tint" color="informative">
                  {role}
                </Badge>
              ))}
            </div>
            <Text size={200} className="muted-text">
              Vista ejecutiva para validar el modelo RBAC solicitado por negocio.
            </Text>
          </Card>

          <Card>
            <Text weight="semibold">Roles disponibles</Text>
            <div className="badge-wrap">
              {data.availableRoles.map((role) => (
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
                  {data.sampleUsers.map((entry) => (
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
        </>
      ) : null}
    </div>
  );
}
