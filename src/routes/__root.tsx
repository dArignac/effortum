// src/routes/__root.tsx
/// <reference types="vite/client" />
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TasksProvider } from "../contexts/TasksContext";
import { ProjectsProvider } from "../contexts/ProjectsContext";

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
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <TasksProvider>
            <ProjectsProvider>{children}</ProjectsProvider>
          </TasksProvider>
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}
