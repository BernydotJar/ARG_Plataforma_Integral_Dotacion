import { Card, Text } from "@fluentui/react-components";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Card className="section-card">
      <div className="section-card-header">
        <Text weight="semibold">{title}</Text>
        {subtitle ? <Text size={200}>{subtitle}</Text> : null}
      </div>
      {children}
    </Card>
  );
}
