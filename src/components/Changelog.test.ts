import { Anchor } from "@mantine/core";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { renderDescription, renderDescriptionLines } from "./Changelog";

type IssueAnchorProps = {
  href: string;
  target: string;
  rel: string;
  children: string;
};

function isIssueAnchorElement(
  node: unknown,
): node is { props: IssueAnchorProps } {
  return isValidElement<IssueAnchorProps>(node) && node.type === Anchor;
}

function expectIssueAnchor(node: unknown, issueId: string) {
  expect(isIssueAnchorElement(node)).toBe(true);

  if (!isIssueAnchorElement(node)) {
    return;
  }

  expect(node.props.href).toBe(
    `https://codeberg.org/darignac/effortum/issues/${issueId}`,
  );
  expect(node.props.target).toBe("_blank");
  expect(node.props.rel).toBe("noreferrer noopener");
  expect(node.props.children).toBe(`Issue #${issueId}`);
}

describe("renderDescription", () => {
  it("returns unchanged text when no issue pattern is present", () => {
    const description = "Adds changelog view.";
    const result = renderDescription(description);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([description]);
  });

  it("returns empty string for empty input", () => {
    expect(renderDescription("")).toBe("");
  });

  it("creates a link when a single issue appears in the description", () => {
    const result = renderDescription("Fixes migration bug (Issue #3).");

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("Fixes migration bug (");
    expectIssueAnchor(result[1], "3");
    expect(result[2]).toBe(").");
  });

  it("supports issue token positions at start, middle, and end", () => {
    const scenarios = [
      {
        description: "Issue #10 introduces settings sync",
        expected: ["issue", "text"],
      },
      {
        description: "Tracks progress in Issue #11 today",
        expected: ["text", "issue", "text"],
      },
      {
        description: "Settings migration references Issue #12",
        expected: ["text", "issue"],
      },
    ] as const;

    for (const { description, expected } of scenarios) {
      const result = renderDescription(description) as unknown[];

      expect(Array.isArray(result)).toBe(true);
      expect(
        result.map((part) => (typeof part === "string" ? "text" : "issue")),
      ).toEqual(expected);
    }
  });

  it("creates links for multiple issue references in one sentence", () => {
    const result = renderDescription("Issue #1 and Issue #2 were addressed");

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
    expectIssueAnchor(result[0], "1");
    expect(result[1]).toBe(" and ");
    expectIssueAnchor(result[2], "2");
    expect(result[3]).toBe(" were addressed");
  });

  it("handles consecutive issue tokens without dropping any link", () => {
    const result = renderDescription("Issue #1Issue #2");

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expectIssueAnchor(result[0], "1");
    expectIssueAnchor(result[1], "2");
  });

  it("keeps malformed and case-mismatched issue text unchanged", () => {
    expect(renderDescription("issue #5 should not link")).toEqual([
      "issue #5 should not link",
    ]);
    expect(renderDescription("Issue#5 should not link")).toEqual([
      "Issue#5 should not link",
    ]);
    expect(renderDescription("Issue  #5 should not link")).toEqual([
      "Issue  #5 should not link",
    ]);
  });

  it("preserves surrounding unicode text while linking issue tokens", () => {
    const result = renderDescription(
      "Fix für Überstunden in Issue #8 heute",
    ) as unknown[];

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("Fix für Überstunden in ");
    expectIssueAnchor(result[1], "8");
    expect(result[2]).toBe(" heute");
  });
});

describe("renderDescriptionLines", () => {
  it("renders each description line as a bullet list item", () => {
    const result = renderDescriptionLines([
      "Technical: Adds db table for settings only.",
      "This is to evaluate migration issues (Issue #3).",
    ]);

    expect(isValidElement<{ children: unknown[] }>(result)).toBe(true);

    if (!isValidElement<{ children: unknown[] }>(result)) {
      return;
    }

    expect(result.type).toBe("ul");
    const children = result.props.children as unknown[];

    expect(children).toHaveLength(2);
    expect(isValidElement<{ children: unknown[] }>(children[0])).toBe(true);

    if (
      !isValidElement<{ children: unknown[] }>(children[0]) ||
      !isValidElement<{ children: unknown[] }>(children[1])
    ) {
      return;
    }

    expect(children[0].type).toBe("li");
    expect(children[0].props.children).toEqual([
      "Technical: Adds db table for settings only.",
    ]);

    expect(children[1].type).toBe("li");
    const secondLineParts = children[1].props.children as unknown[];
    expect(secondLineParts).toHaveLength(3);
    expect(secondLineParts[0]).toBe("This is to evaluate migration issues (");
    expectIssueAnchor(secondLineParts[1], "3");
    expect(secondLineParts[2]).toBe(").");
  });

  it("renders an empty list for empty description arrays", () => {
    const result = renderDescriptionLines([]);

    expect(isValidElement<{ children: unknown[] }>(result)).toBe(true);

    if (!isValidElement<{ children: unknown[] }>(result)) {
      return;
    }

    expect(result.type).toBe("ul");
    expect(result.props.children).toEqual([]);
  });
});
