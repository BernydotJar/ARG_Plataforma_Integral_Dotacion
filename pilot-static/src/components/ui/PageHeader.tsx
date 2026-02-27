import { Text } from "@fluentui/react-components";

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <Text as="h1" size={700} weight="semibold" block>
          {title}
        </Text>
        <Text as="p" size={300} className="muted-text" block>
          {description}
        </Text>
      </div>
    </header>
  );
}
