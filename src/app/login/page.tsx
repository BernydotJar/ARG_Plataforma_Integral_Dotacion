"use client";

import {
  Button,
  Card,
  CardHeader,
  Spinner,
  Text,
  useToastController,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import { LockClosed24Regular } from "@fluentui/react-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { loginWithEntra } from "@/lib/auth/msal-client";
import { isEntraConfigured } from "@/lib/config/public-env";
import { apiFetch, ApiRequestError } from "@/lib/http/client";

type SessionResponse = {
  user: {
    id: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const { dispatchToast } = useToastController(APP_TOASTER_ID);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await apiFetch<SessionResponse>("/api/auth/session");
        router.push("/");
        router.refresh();
      } catch {
        // Usuario no autenticado, se mantiene en login.
      } finally {
        setCheckingSession(false);
      }
    };

    void checkSession();
  }, [router]);

  const handleEntraLogin = async () => {
    setBusy(true);
    setError(null);

    try {
      const { idToken } = await loginWithEntra();
      await apiFetch<{ user: { id: string } }>("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Error al autenticar con Entra ID";
      setError(message);
      dispatchToast(
        <Toast>
          <ToastTitle>Error de autenticación</ToastTitle>
          <ToastBody>{message}</ToastBody>
        </Toast>,
        { intent: "error" },
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDemoAccess = async () => {
    setBusy(true);
    setError(null);

    try {
      await apiFetch<{ ok: boolean }>("/api/auth/session/demo", {
        method: "POST",
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Modo demo activo</ToastTitle>
          <ToastBody>Sesión creada con credenciales de demostración.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No fue posible iniciar modo demo";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-hero">
        <Image src="/argos-logo.webp" alt="Argos" width={130} height={45} className="login-logo" priority />
        <Text as="h1" size={900} weight="semibold" block>
          ARGOS
        </Text>
        <Text as="h2" size={600} block>
          Plataforma Integral
        </Text>
        <Text className="muted-text-on-dark" block>
          Portal corporativo para operación de Dotación, Inventario, Calidad y Mantenimiento.
        </Text>
      </div>

      <Card className="login-card">
        <CardHeader
          image={<LockClosed24Regular fontSize={22} />}
          header={<Text weight="semibold">Inicio de sesión</Text>}
          description={<Text>Accede con tu cuenta corporativa Microsoft Entra ID.</Text>}
        />

        {checkingSession ? <Spinner label="Validando sesión..." /> : null}

        {!checkingSession ? (
          <>
            <Button appearance="primary" disabled={busy || !isEntraConfigured()} onClick={handleEntraLogin}>
              {busy ? "Ingresando..." : "Iniciar sesión con Microsoft"}
            </Button>

            {!isEntraConfigured() ? (
              <>
                <Text size={200} className="muted-text">
                  Configura `NEXT_PUBLIC_ENTRA_TENANT_ID` y `NEXT_PUBLIC_ENTRA_CLIENT_ID` para habilitar SSO.
                </Text>
                <Button appearance="secondary" disabled={busy} onClick={handleDemoAccess}>
                  Entrar en modo demo
                </Button>
              </>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Text className="error-text" size={200}>
            {error}
          </Text>
        ) : null}

      </Card>
    </main>
  );
}
