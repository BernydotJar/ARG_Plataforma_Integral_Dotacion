import { Button, Text } from "@fluentui/react-components";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({ title, description, actionHref, actionLabel }: PageHeaderProps) {
  return (
    <header className="page-header" data-tour="page-header">
      <div>
        <Text as="h1" size={700} weight="semibold" block>
          {title}
        </Text>
        <Text as="p" size={300} className="muted-text" block>
          {description}
        </Text>
      </div>
      {actionHref && actionLabel ? (
        <Button as="a" href={actionHref} appearance="primary" className="touch-action-button" data-tour="page-header-action">
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}
