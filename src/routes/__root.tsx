import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";

import { useEffortumStore } from "@/store";
import { VERSION } from "@/version";
import {
  Center,
  Container,
  createTheme,
  MantineProvider,
  Text,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

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

  shellComponent: RootDocument,
  ssr: false,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useEffortumStore.getState().loadFromIndexedDb();
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
          <Container size="xs" mt={40}>
            <Center>
              <Text size="xs">Version: {VERSION}</Text>
            </Center>
          </Container>
          <Notifications />
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}
