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
            Un operario virtual te guía en este recorrido inicial mientras revisas los módulos críticos del día.
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
          <div className="plant-hero-worker">
            <svg viewBox="0 0 220 280" className="plant-hero-svg" role="presentation">
              <g className="worker-shadow">
                <ellipse cx="110" cy="263" rx="56" ry="12" fill="rgba(2, 29, 73, 0.22)" />
              </g>
              <g className="worker-backpack">
                <rect x="78" y="88" width="64" height="84" rx="26" fill="#12386f" />
              </g>
              <g className="worker-body">
                <rect x="73" y="90" width="74" height="95" rx="30" fill="#0a2f66" />
                <rect x="90" y="95" width="40" height="86" rx="16" fill="#ffd84f" />
                <rect x="98" y="95" width="24" height="86" rx="10" fill="#f5c940" />
                <rect x="92" y="120" width="36" height="8" rx="4" fill="#0a2f66" opacity="0.45" />
              </g>
              <g className="worker-head">
                <circle cx="110" cy="64" r="26" fill="#f2c8a6" />
                <path d="M84 66c8 6 20 10 26 10s18-4 26-10" fill="#254b86" />
              </g>
              <g className="worker-helmet">
                <path d="M75 60c6-20 22-32 35-32s29 12 35 32H75z" fill="#ffffff" />
                <rect x="73" y="56" width="74" height="12" rx="6" fill="#dfe8f2" />
              </g>
              <g className="worker-arm-left">
                <rect x="56" y="106" width="22" height="68" rx="11" fill="#0a2f66" />
                <circle cx="67" cy="174" r="11" fill="#f2c8a6" />
              </g>
              <g className="worker-arm-right">
                <rect x="144" y="100" width="20" height="66" rx="10" fill="#0a2f66" />
                <circle cx="154" cy="166" r="11" fill="#f2c8a6" />
              </g>
              <g className="worker-legs">
                <rect x="80" y="179" width="24" height="70" rx="11" fill="#1b2740" />
                <rect x="116" y="179" width="24" height="70" rx="11" fill="#1b2740" />
                <rect x="76" y="245" width="34" height="16" rx="8" fill="#111a2b" />
                <rect x="112" y="245" width="34" height="16" rx="8" fill="#111a2b" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
}
