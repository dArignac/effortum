import { Changelog, VERSION } from "@/components/Changelog";
import { BudgetsPage } from "@/pages/BudgetsPage";
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
  IconCoin,
  IconConfetti,
  IconDatabaseExport,
  IconFolders,
  IconMessage,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const NAV_ITEMS = [
  {
    testId: "nav-collect-times",
    label: "Collect Times",
    icon: IconCalendarStats,
    render: () => <TimeCollectorPage />,
  },
  {
    testId: "nav-import-export",
    label: "Import & Export Data",
    icon: IconDatabaseExport,
    render: () => <ImportExportPage />,
  },
  {
    testId: "nav-settings",
    label: "Settings",
    icon: IconAlarmAverage,
    render: () => <SettingsPage />,
  },
  {
    testId: "nav-projects",
    label: "Projects",
    icon: IconFolders,
    render: () => <ProjectsPage />,
  },
  {
    testId: "nav-budgets",
    label: "Budgets",
    icon: IconCoin,
    render: () => <BudgetsPage />,
  },
  {
    testId: "nav-tasks",
    label: "Tasks",
    icon: IconMessage,
    render: () => <TasksPage />,
  },
  {
    testId: "nav-changelog",
    label: "Changelog",
    icon: IconConfetti,
    render: () => <Changelog />,
  },
] as const;

const CHANGELOG_NAV_INDEX = NAV_ITEMS.findIndex(
  (item) => item.testId === "nav-changelog",
);

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
          <Anchor
            c="dimmed"
            pt={2}
            onClick={() => setActiveNavIndex(CHANGELOG_NAV_INDEX)}
          >
            v{VERSION}
          </Anchor>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.testId}
              data-testid={item.testId}
              active={activeNavIndex === index}
              onClick={() => setActiveNavIndex(index)}
              label={item.label}
              leftSection={<Icon size={20} stroke={1.5} />}
            />
          );
        })}
      </AppShell.Navbar>
      <AppShell.Main>{NAV_ITEMS[activeNavIndex]?.render()}</AppShell.Main>
    </AppShell>
  );
}
