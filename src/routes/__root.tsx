// src/routes/__root.tsx
/// <reference types="vite/client" />
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ProjectsProvider } from "../contexts/ProjectsContext";
import { TasksProvider } from "../contexts/TasksContext";

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
          <Notifications />
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}
