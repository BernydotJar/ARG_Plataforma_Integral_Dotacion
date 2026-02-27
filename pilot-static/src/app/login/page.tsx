"use client";

import { Button, Card, Text } from "@fluentui/react-components";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="login-page">
      <Card className="login-card">
        <Text as="h1" weight="semibold" className="page-title" block>
          ARGOS - Plataforma Integral
        </Text>
        <Text className="muted-text" block>
          Modo piloto en GitHub Pages. Esta vista simula autenticación empresarial.
        </Text>

        <Button appearance="primary" onClick={() => router.push("/")}>
          Continuar al portal
        </Button>
      </Card>
    </main>
  );
}
