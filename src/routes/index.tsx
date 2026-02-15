import { ImportExport } from "@/pages/ImportExport";
import { Overtime } from "@/pages/Overtime";
import { TimeCollector } from "@/pages/TimeCollector";
import { VERSION } from "@/version";
import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlarmAverage,
  IconCalendarStats,
  IconDatabaseExport,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({ ssr: false, component: App });

function App() {
  const [navigationOpened, { toggle: toggleNavigation }] = useDisclosure(false);
  const [activeNavIndex, setActiveNavIndex] = useState(0);

  return (
    <AppShell
      padding="md"
      header={{ height: 35 }}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: { mobile: !navigationOpened, desktop: !navigationOpened },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            data-testid="navigation-burger"
            opened={navigationOpened}
            onClick={toggleNavigation}
            size="sm"
          />
          <Text fw={700}>Effortum</Text>
          <Text c="dimmed">v{VERSION}</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <NavLink
          data-testid="nav-collect-times"
          active={activeNavIndex === 0}
          onClick={() => setActiveNavIndex(0)}
          label="Collect Times"
          leftSection={<IconCalendarStats size={20} stroke={1.5} />}
        />
        <NavLink
          data-testid="nav-import-export"
          active={activeNavIndex === 1}
          onClick={() => setActiveNavIndex(1)}
          label="Import & Export Data"
          leftSection={<IconDatabaseExport size={20} stroke={1.5} />}
        />
        <NavLink
          data-testid="nav-overtime"
          active={activeNavIndex === 2}
          onClick={() => setActiveNavIndex(2)}
          label="Overtime Settings"
          leftSection={<IconAlarmAverage size={20} stroke={1.5} />}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        {activeNavIndex === 0 && <TimeCollector />}
        {activeNavIndex === 1 && <ImportExport />}
        {activeNavIndex === 2 && <Overtime />}
      </AppShell.Main>
    </AppShell>
  );
}
