import { Badge, Card, Text } from "@fluentui/react-components";
import { CheckmarkCircle24Regular } from "@fluentui/react-icons";

const highlights = [
  "Dotación por sede y rol",
  "Inventario y ajustes con aprobación",
  "Calidad y mantenimiento en un solo portal",
] as const;

export function PlantWorkerHero() {
  return (
    <Card className="plant-hero-card">
      <div className="plant-hero-grid">
        <div className="plant-hero-copy">
          <Badge appearance="tint" color="informative">
            Operación ARGOS
          </Badge>
          <Text as="h2" size={700} weight="semibold" block>
            Bienvenido al centro de operación integral
          </Text>
          <Text className="muted-text" block>
            Un operario virtual llega a escena y saluda para presentar las capacidades del portal.
          </Text>

          <div className="plant-hero-points" role="list" aria-label="Capacidades principales">
            {highlights.map((entry) => (
              <div key={entry} className="plant-hero-point" role="listitem">
                <CheckmarkCircle24Regular />
                <Text>{entry}</Text>
              </div>
            ))}
          </div>
        </div>

        <div className="plant-hero-stage" aria-hidden="true">
          <video
            className="plant-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/operario-poster.jpg"
          >
            <source src="/media/operario.webm" type="video/webm" />
            <source src="/media/operario.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </Card>
  );
}
