import { Text } from "@fluentui/react-components";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ title, description, icon, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <Text weight="semibold">{title}</Text>
      {description ? <Text className="muted-text">{description}</Text> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
