import { Anchor, Table, Title } from "@mantine/core";
import type { ReactNode } from "react";

const changelogEntries = [
  {
    version: "0.11.3",
    description: [
      "Improved database structure (Issue #49). Older backups are migrated automatically during import.",
    ],
  },
  {
    version: "0.11.2",
    description: ["Software library dependencies updated."],
  },
  {
    version: "0.11.1",
    description: ["Software library dependencies updated."],
  },
  {
    version: "0.11.0",
    description: [
      'Rounds the times to the nearest 5 minutes when the setting is enabled. This can be configured in the "Settings" view.',
      'Renames "Overtime Settings" to "Settings" and creates the new settings page.',
      "Layout of changelog has been improved for multiple entries.",
      "Software library dependencies have been updated.",
    ],
  },
  {
    version: "0.10.2",
    description: ["Software library dependencies updated."],
  },
  {
    version: "0.10.1",
    description: ["Software library dependencies updated."],
  },
  {
    version: "0.10.0",
    description: ["The changelog view was added."],
  },
  {
    version: "0.9.2",
    description: [
      "Technical: Adds db table for settings only.",
      "This is to evaluate if we run into database migration issues (Issue #3).",
    ],
  },
  {
    version: "0.9.1",
    description: ["Software library dependencies updated."],
  },
  {
    version: "0.9.0",
    description: ["Adds grouping of tasks by comment for spent hours summary."],
  },
  {
    version: "0.8.1",
    description: [
      "Improves the layout for longer project and task names and adds a per-project total row in the Summary view.",
    ],
  },
  { version: "0.8.0", description: ["Adds overtime storage."] },
  {
    version: "0.7.1",
    description: ["Updates dependencies to latest versions."],
  },
  { version: "0.7.0", description: ["Adds basic layout and navigation."] },
  { version: "0.6.2", description: ["Updates packages to latest versions."] },
];

export const VERSION = changelogEntries[0].version;

const issuePattern = /Issue #(\d+)/g;

export function renderDescription(description: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of description.matchAll(issuePattern)) {
    const [fullMatch, issueId] = match;
    const startIndex = match.index ?? 0;
    const endIndex = startIndex + fullMatch.length;

    if (startIndex > lastIndex) {
      parts.push(description.slice(lastIndex, startIndex));
    }

    parts.push(
      <Anchor
        key={`issue-${issueId}-${startIndex}`}
        href={`https://github.com/darignac/effortum/issues/${issueId}`}
        target="_blank"
        rel="noreferrer noopener"
        size="sm"
      >
        {fullMatch}
      </Anchor>,
    );

    lastIndex = endIndex;
  }

  if (lastIndex < description.length) {
    parts.push(description.slice(lastIndex));
  }

  return parts.length > 0 ? parts : description;
}

export function renderDescriptionLines(descriptionLines: string[]) {
  return (
    <ul style={{ margin: 0, paddingInlineStart: "0", listStyleType: "none" }}>
      {descriptionLines.map((line, index) => (
        <li key={`${index}-${line}`}>{renderDescription(line)}</li>
      ))}
    </ul>
  );
}

export function Changelog() {
  const rows = changelogEntries.map((element) => (
    <Table.Tr key={element.version}>
      <Table.Td valign="top">{element.version}</Table.Td>
      <Table.Td>{renderDescriptionLines(element.description)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Title order={3} mb={20}>
        Changelog
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Version</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
