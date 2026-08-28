import { Changelog, VERSION } from "@/components/Changelog";
import { ImportExportPage } from "@/pages/ImportExportPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TasksPage } from "@/pages/TasksPage";
import { TimeCollectorPage } from "@/pages/TimeCollectorPage";
import { Anchor, AppShell, Burger, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlarmAverage,
  IconCalendarStats,
  IconConfetti,
  IconDatabaseExport,
  IconFolders,
  IconList,
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
          <Anchor fw={700} c="dark" pt={2} onClick={() => setActiveNavIndex(0)}>
            Effortum
          </Anchor>
          <Anchor c="dimmed" pt={2} onClick={() => setActiveNavIndex(5)}>
            v{VERSION}
          </Anchor>
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
          data-testid="nav-settings"
          active={activeNavIndex === 2}
          onClick={() => setActiveNavIndex(2)}
          label="Settings"
          leftSection={<IconAlarmAverage size={20} stroke={1.5} />}
        />
        <NavLink
          data-testid="nav-projects"
          active={activeNavIndex === 3}
          onClick={() => setActiveNavIndex(3)}
          label="Projects"
          leftSection={<IconFolders size={20} stroke={1.5} />}
        />
        <NavLink
          data-testid="nav-tasks"
          active={activeNavIndex === 4}
          onClick={() => setActiveNavIndex(4)}
          label="Tasks"
          leftSection={<IconList size={20} stroke={1.5} />}
        />
        <NavLink
          data-testid="nav-changelog"
          active={activeNavIndex === 5}
          onClick={() => setActiveNavIndex(5)}
          label="Changelog"
          leftSection={<IconConfetti size={20} stroke={1.5} />}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        {activeNavIndex === 0 && <TimeCollectorPage />}
        {activeNavIndex === 1 && <ImportExportPage />}
        {activeNavIndex === 2 && <SettingsPage />}
        {activeNavIndex === 3 && <ProjectsPage />}
        {activeNavIndex === 4 && <TasksPage />}
        {activeNavIndex === 5 && <Changelog />}
      </AppShell.Main>
    </AppShell>
  );
}
