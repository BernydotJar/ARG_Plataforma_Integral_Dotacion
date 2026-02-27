import { Button, Text } from "@fluentui/react-components";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({ title, description, actionHref, actionLabel }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <Text as="h1" className="page-title" weight="semibold" block>
          {title}
        </Text>
        <Text className="page-subtitle" size={300} block>
          {description}
        </Text>
      </div>
      {actionHref && actionLabel ? (
        <Button as="a" href={actionHref} appearance="primary">
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}
