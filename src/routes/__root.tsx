// src/routes/__root.tsx
/// <reference types="vite/client" />
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useEffortumStore } from "../store";

const theme = createTheme({
  /** Put your mantine theme override here */
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Effortum",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    useEffortumStore.getState().loadFromIndexedDb();
  }, []);

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
          <Notifications />
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}
