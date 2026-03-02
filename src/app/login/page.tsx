"use client";

import {
  Button,
  Card,
  CardHeader,
  Divider,
  Field,
  Input,
  Spinner,
  Text,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { LockClosed24Regular } from "@fluentui/react-icons";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { APP_TOASTER_ID } from "@/components/providers/AppProviders";
import { loginWithEntra } from "@/lib/auth/msal-client";
import { isEntraConfigured, isTurnstileEnabled, publicEnv } from "@/lib/config/public-env";
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

  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);

  const captchaEnabled = isTurnstileEnabled();

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

  useEffect(() => {
    if (!captchaEnabled || !turnstileLoaded || !captchaContainerRef.current || !window.turnstile) {
      return;
    }

    if (captchaWidgetIdRef.current) {
      return;
    }

    captchaWidgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
      sitekey: publicEnv.turnstileSiteKey,
      theme: "light",
      callback: (token) => {
        setCaptchaToken(token);
      },
      "expired-callback": () => {
        setCaptchaToken("");
      },
      "error-callback": () => {
        setCaptchaToken("");
        setError("No se pudo validar el captcha. Recarga la página e intenta nuevamente.");
      },
    });

    return () => {
      if (captchaWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(captchaWidgetIdRef.current);
        captchaWidgetIdRef.current = null;
      }
    };
  }, [captchaEnabled, turnstileLoaded]);

  const resetCaptcha = () => {
    if (!captchaEnabled || !captchaWidgetIdRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(captchaWidgetIdRef.current);
    setCaptchaToken("");
  };

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

  const handleOperarioLogin = async () => {
    setBusy(true);
    setError(null);

    if (captchaEnabled && !captchaToken) {
      setError("Completa la validación de seguridad para continuar.");
      setBusy(false);
      return;
    }

    try {
      await apiFetch<{ ok: boolean }>("/api/auth/session/operario", {
        method: "POST",
        body: JSON.stringify({
          identificacion,
          password,
          captchaToken: captchaEnabled ? captchaToken : undefined,
        }),
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Operario autenticado</ToastTitle>
          <ToastBody>Sesión de operario iniciada correctamente.</ToastBody>
        </Toast>,
        { intent: "success" },
      );

      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "No fue posible iniciar sesión operario";
      setError(message);
      resetCaptcha();
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
      {captchaEnabled ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileLoaded(true)}
          onError={() => setError("No se pudo cargar validación de seguridad en este navegador.")}
        />
      ) : null}

      <div className="login-hero">
        <Image src="/argos-logo.webp" alt="Argos" width={302} height={166} className="login-logo" priority />
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
          description={<Text>Accede con SSO corporativo o con credenciales de operario (piloto).</Text>}
        />

        {checkingSession ? <Spinner label="Validando sesión..." /> : null}

        {!checkingSession ? (
          <>
            <Button appearance="primary" disabled={busy || !isEntraConfigured()} onClick={handleEntraLogin}>
              {busy ? "Ingresando..." : "Iniciar sesión con Microsoft"}
            </Button>

            {!isEntraConfigured() ? (
              <Text size={200} className="muted-text">
                Configura `NEXT_PUBLIC_ENTRA_TENANT_ID` y `NEXT_PUBLIC_ENTRA_CLIENT_ID` para habilitar SSO.
              </Text>
            ) : null}

            <Divider />

            <Text weight="semibold" size={300}>
              Ingreso operario (piloto)
            </Text>
            <Field label="Identificación" required>
              <Input
                value={identificacion}
                onChange={(_, data) => setIdentificacion(data.value)}
                placeholder="Ej: 100"
              />
            </Field>
            <Field label="Contraseña" required>
              <Input
                type="password"
                value={password}
                onChange={(_, data) => setPassword(data.value)}
                placeholder="Contraseña operario"
              />
            </Field>

            {captchaEnabled ? (
              <>
                <div ref={captchaContainerRef} className="turnstile-slot" />
                <Text size={200} className="muted-text">
                  Validación de seguridad habilitada para acceso de operarios.
                </Text>
              </>
            ) : null}

            <Button
              appearance="secondary"
              disabled={busy || !identificacion.trim() || !password.trim() || (captchaEnabled && !captchaToken)}
              onClick={handleOperarioLogin}
            >
              {busy ? "Validando..." : "Ingresar como operario"}
            </Button>

            <Divider />

            <Button appearance="subtle" disabled={busy} onClick={handleDemoAccess}>
              Entrar en modo demo administrativo
            </Button>
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
