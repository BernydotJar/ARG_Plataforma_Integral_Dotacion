"use client";

import { FluentProvider, SSRProvider, Toaster, webLightTheme, type Theme } from "@fluentui/react-components";

export const APP_TOASTER_ID = "argos-toaster";

const argosTheme: Theme = {
  ...webLightTheme,
  colorBrandBackground: "#021D49",
  colorBrandBackgroundHover: "#0A2F66",
  colorBrandBackgroundPressed: "#011431",
  colorBrandForeground1: "#021D49",
  colorBrandForeground2: "#0072C9",
  colorStrokeFocus2: "#B6D713",
  colorNeutralForeground1: "#1B2740",
  colorNeutralForeground2: "#4D4D4D",
  colorNeutralBackground1: "#F8FAFE",
  colorNeutralBackground2: "#FFFFFF",
  colorNeutralBackground3: "#EAF0F7",
  colorNeutralStroke1: "#D7DFEB",
  colorNeutralStroke2: "#C8D3E4",
  fontFamilyBase: "\"Trebuchet MS\", \"Avenir Next\", \"Segoe UI\", sans-serif",
  fontFamilyMonospace: "\"SFMono-Regular\", Menlo, Monaco, Consolas, \"Liberation Mono\", monospace",
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SSRProvider>
      <FluentProvider theme={argosTheme} className="app-provider">
        {children}
        <Toaster toasterId={APP_TOASTER_ID} position="top-end" />
      </FluentProvider>
    </SSRProvider>
  );
}
