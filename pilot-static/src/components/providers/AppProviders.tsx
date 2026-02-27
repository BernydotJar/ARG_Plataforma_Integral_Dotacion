"use client";

import { FluentProvider, SSRProvider, webLightTheme, type Theme } from "@fluentui/react-components";

const argosTheme: Theme = {
  ...webLightTheme,
  colorBrandBackground: "#021D49",
  colorBrandBackgroundHover: "#0A2F66",
  colorBrandBackgroundPressed: "#011431",
  colorBrandForeground1: "#021D49",
  colorBrandForeground2: "#0072C9",
  colorStrokeFocus2: "#021D49",
  colorNeutralForeground1: "#1B2740",
  colorNeutralForeground2: "#4D4D4D",
  colorNeutralBackground1: "#F8FAFE",
  colorNeutralBackground2: "#FFFFFF",
  colorNeutralBackground3: "#EAF0F7",
  colorNeutralStroke1: "#D7DFEB",
  colorNeutralStroke2: "#C8D3E4",
  fontFamilyBase: "\"Inter\", \"Segoe UI\", system-ui, -apple-system, sans-serif",
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SSRProvider>
      <FluentProvider theme={argosTheme} className="app-provider">
        {children}
      </FluentProvider>
    </SSRProvider>
  );
}
