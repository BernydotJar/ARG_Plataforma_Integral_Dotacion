"use client";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Field,
  Input,
  Option,
  Skeleton,
  SkeletonItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import {
  Box24Regular,
  BuildingHome24Regular,
  DatabaseSearch24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { CentroCosto } from "@/lib/dataverse/types";
import type { KitDotacionWithItems } from "@/lib/dataverse/repository";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type CatalogosOverviewResponse = {
  data: Record<string, Array<{ id: string; nombre?: string; codigo?: string }>>;
};

type CentrosCostoResponse = {
  data: CentroCosto[];
};

type KitsResponse = {
  data: KitDotacionWithItems[];
};

const generos = ["Masculino", "Femenino", "Unisex"] as const;

type KitItemDraft = {
  id: string;
  itemNombre: string;
  cantidad: string;
  obligatorio: boolean;
};

const newKitItemDraft = (): KitItemDraft => ({
  id: crypto.randomUUID(),
  itemNombre: "",
  cantidad: "1",
  obligatorio: true,
});

export function CatalogosPageClient() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [overview, setOverview] = useState<CatalogosOverviewResponse["data"] | null>(null);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [kits, setKits] = useState<KitDotacionWithItems[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingCentro, setSavingCentro] = useState(false);
  const [savingKit, setSavingKit] = useState(false);

  const [centroSedeId, setCentroSedeId] = useState("");
  const [centroCodigo, setCentroCodigo] = useState("");
  const [centroNombre, setCentroNombre] = useState("");

  const [kitSedeId, setKitSedeId] = useState("");
  const [kitNombre, setKitNombre] = useState("");
  const [kitGenero, setKitGenero] = useState<(typeof generos)[number]>("Unisex");
  const [kitCargo, setKitCargo] = useState("");
  const [kitCiclo, setKitCiclo] = useState("");
  const [kitItems, setKitItems] = useState<KitItemDraft[]>([newKitItemDraft()]);

  const metrics = useMemo(
    () => [
      {
        label: "Sedes",
        value: overview?.sedes?.length ?? 0,
      },
      {
        label: "Empleados",
        value: overview?.empleados?.length ?? 0,
      },
      {
        label: "Ítems dotación",
        value: overview?.itemsDotacion?.length ?? 0,
      },
      {
        label: "Áreas",
        value: overview?.areas?.length ?? 0,
      },
      {
        label: "Centros costo",
        value: centrosCosto.length,
      },
      {
        label: "Kits",
        value: kits.length,
      },
    ],
    [overview, centrosCosto.length, kits.length],
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewPayload, centrosPayload, kitsPayload] = await Promise.all([
        apiFetch<CatalogosOverviewResponse>("/api/admin/catalogos"),
        apiFetch<CentrosCostoResponse>("/api/admin/catalogos/centros-costo"),
        apiFetch<KitsResponse>("/api/admin/catalogos/kits"),
      ]);

      setOverview(overviewPayload.data);
      setCentrosCosto(centrosPayload.data);
      setKits(kitsPayload.data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudieron cargar catálogos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createCentroCosto = async () => {
    setSavingCentro(true);
    setError(null);

    try {
      const payload = await apiFetch<{ data: CentroCosto }>("/api/admin/catalogos/centros-costo", {
        method: "POST",
        body: JSON.stringify({
          sedeId: centroSedeId || undefined,
          codigo: centroCodigo,
          nombre: centroNombre,
        }),
      });

      setCentrosCosto((current) => [payload.data, ...current]);
      setCentroCodigo("");
      setCentroNombre("");

      dispatchToast(
        <Toast>
          <ToastTitle>Centro de costo creado</ToastTitle>
          <ToastBody>Se agregó correctamente al catálogo.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear el centro de costo");
    } finally {
      setSavingCentro(false);
    }
  };

  const createKit = async () => {
    const normalizedItems = kitItems
      .map((entry) => ({
        itemNombre: entry.itemNombre.trim(),
        cantidad: Number(entry.cantidad),
        obligatorio: entry.obligatorio,
      }))
      .filter((entry) => Boolean(entry.itemNombre) && Number.isFinite(entry.cantidad) && entry.cantidad > 0);

    if (normalizedItems.length === 0) {
      setError("Debes ingresar al menos un ítem válido para el kit");
      return;
    }

    setSavingKit(true);
    setError(null);

    try {
      const payload = await apiFetch<{ data: KitDotacionWithItems }>("/api/admin/catalogos/kits", {
        method: "POST",
        body: JSON.stringify({
          sedeId: kitSedeId || undefined,
          nombre: kitNombre,
          genero: kitGenero,
          cargo: kitCargo,
          ciclo: kitCiclo,
          items: normalizedItems,
        }),
      });

      setKits((current) => [payload.data, ...current]);
      setKitNombre("");
      setKitCargo("");
      setKitCiclo("");
      setKitItems([newKitItemDraft()]);

      dispatchToast(
        <Toast>
          <ToastTitle>Kit de dotación creado</ToastTitle>
          <ToastBody>El kit quedó disponible para la sede seleccionada.</ToastBody>
        </Toast>,
        { intent: "success" },
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo crear el kit");
    } finally {
      setSavingKit(false);
    }
  };

  const addKitItem = () => {
    setKitItems((current) => [...current, newKitItemDraft()]);
  };

  const updateKitItem = (id: string, patch: Partial<KitItemDraft>) => {
    setKitItems((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const removeKitItem = (id: string) => {
    setKitItems((current) => {
      if (current.length === 1) return current;
      return current.filter((entry) => entry.id !== id);
    });
  };

  const canCreateCentro = Boolean(centroCodigo.trim() && centroNombre.trim());
  const canCreateKit = Boolean(kitNombre.trim() && kitCargo.trim() && kitCiclo.trim());

  return (
    <div className="page-container">
      <PageHeader
        title="Administración de catálogos"
        description="Master data operativo para Fase 1: centros de costo, kits y parámetros base"
      />

      {error ? (
        <Card>
          <Text weight="semibold">No se pudieron cargar o actualizar catálogos</Text>
          <Text className="muted-text">{error}</Text>
          <Button appearance="secondary" onClick={() => void load()}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <div className="card-grid four-col">
        {metrics.map((entry) => (
          <Card key={entry.label} className="module-card">
            <div className="module-card-title-row">
              <Text weight="semibold">{entry.label}</Text>
              <Badge appearance="filled" color="informative">
                {entry.value}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="card-grid two-col">
        <Card className="section-card stack gap-12">
          <div className="section-card-header">
            <Text weight="semibold">Centros de costo</Text>
            <Badge appearance="tint" color="informative">
              {centrosCosto.length}
            </Badge>
          </div>

          <div className="form-grid two-col">
            <Field label="Sede ID (opcional)">
              <Input value={centroSedeId} onChange={(_, data) => setCentroSedeId(data.value)} />
            </Field>
            <Field label="Código" required>
              <Input value={centroCodigo} onChange={(_, data) => setCentroCodigo(data.value)} />
            </Field>
            <Field label="Nombre" required>
              <Input value={centroNombre} onChange={(_, data) => setCentroNombre(data.value)} />
            </Field>
          </div>

          <div className="actions-row">
            <Button appearance="primary" disabled={!canCreateCentro || savingCentro} onClick={createCentroCosto}>
              {savingCentro ? <Spinner size="tiny" /> : "Crear centro de costo"}
            </Button>
          </div>

          {loading ? (
            <Skeleton>
              <div className="skeleton-stack">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonItem key={`ceco-skeleton-${index}`} size={16} />
                ))}
              </div>
            </Skeleton>
          ) : (
            <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Nombre</TableHeaderCell>
                  <TableHeaderCell>Sede</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centrosCosto.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.codigo}</TableCell>
                    <TableCell>{entry.nombre}</TableCell>
                    <TableCell>{entry.sedeId}</TableCell>
                  </TableRow>
                ))}
                {centrosCosto.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="table-empty-cell">
                      <EmptyState
                        compact
                        icon={<BuildingHome24Regular fontSize={28} />}
                        title="Sin centros de costo"
                        description="Crea el primer centro de costo para iniciar la parametrización de pedidos."
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            </div>
          )}
        </Card>

        <Card className="section-card stack gap-12">
          <div className="section-card-header">
            <Text weight="semibold">Kits de dotación</Text>
            <Badge appearance="tint" color="informative">
              {kits.length}
            </Badge>
          </div>

          <div className="form-grid two-col">
            <Field label="Sede ID (opcional)">
              <Input value={kitSedeId} onChange={(_, data) => setKitSedeId(data.value)} />
            </Field>
            <Field label="Nombre del kit" required>
              <Input value={kitNombre} onChange={(_, data) => setKitNombre(data.value)} />
            </Field>
            <Field label="Género" required>
              <Dropdown
                value={kitGenero}
                selectedOptions={[kitGenero]}
                onOptionSelect={(_, data) => setKitGenero(String(data.optionValue) as (typeof generos)[number])}
              >
                {generos.map((entry) => (
                  <Option key={entry} value={entry}>
                    {entry}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Cargo" required>
              <Input value={kitCargo} onChange={(_, data) => setKitCargo(data.value)} />
            </Field>
            <Field label="Ciclo" required>
              <Input value={kitCiclo} onChange={(_, data) => setKitCiclo(data.value)} placeholder="2026-S1" />
            </Field>
          </div>

          <Text weight="semibold">Ítems del kit</Text>
          <div className="catalog-inline-list">
            {kitItems.map((entry) => (
              <div key={entry.id} className="catalog-inline-item">
                <Field label="Ítem" required>
                  <Input
                    value={entry.itemNombre}
                    onChange={(_, data) => updateKitItem(entry.id, { itemNombre: data.value })}
                  />
                </Field>
                <Field label="Cantidad" required>
                  <Input
                    type="number"
                    min={1}
                    value={entry.cantidad}
                    onChange={(_, data) => updateKitItem(entry.id, { cantidad: data.value })}
                  />
                </Field>
                <Field label="Obligatorio">
                  <Checkbox
                    checked={entry.obligatorio}
                    onChange={(_, data) => updateKitItem(entry.id, { obligatorio: data.checked === true })}
                    label="Requerido"
                  />
                </Field>
                <Button appearance="subtle" onClick={() => removeKitItem(entry.id)} disabled={kitItems.length === 1}>
                  Quitar
                </Button>
              </div>
            ))}
          </div>

          <div className="actions-row">
            <Button appearance="secondary" onClick={addKitItem}>
              Agregar ítem
            </Button>
            <Button appearance="primary" disabled={!canCreateKit || savingKit} onClick={createKit}>
              {savingKit ? <Spinner size="tiny" /> : "Crear kit"}
            </Button>
          </div>

          {loading ? (
            <Skeleton>
              <div className="skeleton-stack">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonItem key={`kit-skeleton-${index}`} size={16} />
                ))}
              </div>
            </Skeleton>
          ) : (
            <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Kit</TableHeaderCell>
                  <TableHeaderCell>Cargo</TableHeaderCell>
                  <TableHeaderCell>Ciclo</TableHeaderCell>
                  <TableHeaderCell>Ítems</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.nombre}</TableCell>
                    <TableCell>{entry.cargo}</TableCell>
                    <TableCell>{entry.ciclo}</TableCell>
                    <TableCell>{entry.items.length}</TableCell>
                  </TableRow>
                ))}
                {kits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="table-empty-cell">
                      <EmptyState
                        compact
                        icon={<Box24Regular fontSize={28} />}
                        title="Sin kits de dotación"
                        description="Configura al menos un kit para habilitar el cálculo por cargo y ciclo."
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="section-card-header">
          <Text weight="semibold">Vista rápida de catálogos base</Text>
          <Badge appearance="tint" color="brand">
            {Object.keys(overview || {}).length}
          </Badge>
        </div>

        {loading ? (
          <Skeleton>
            <div className="skeleton-stack">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonItem key={`overview-skeleton-${index}`} size={16} />
              ))}
            </div>
          </Skeleton>
        ) : (
          <div className="table-scroll">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Catálogo</TableHeaderCell>
                <TableHeaderCell>Registros</TableHeaderCell>
                <TableHeaderCell>Muestra</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(overview || {}).map(([key, entries]) => (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{entries.length}</TableCell>
                  <TableCell>{entries[0]?.nombre || entries[0]?.codigo || "-"}</TableCell>
                </TableRow>
              ))}
              {!overview || Object.keys(overview).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="table-empty-cell">
                    <EmptyState
                      compact
                      icon={<DatabaseSearch24Regular fontSize={28} />}
                      title="Sin catálogos base"
                      description="Verifica los datos seed o la conexión al backend API."
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
            </div>
        )}
      </Card>
    </div>
  );
}
