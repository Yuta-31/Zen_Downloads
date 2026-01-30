/**
 * Template variable definitions for smart rename patterns.
 * Used across SmartRenameEditor, RuleListRowCard, and Preview components.
 */

export interface TemplateVariable {
  token: string;
  desc: string;
  example?: string;
}

export interface TemplateVariableCategory {
  title: string;
  variables: TemplateVariable[];
}

/**
 * Smart rename template variables (for filename patterns)
 * Used in SmartRenameEditor and RuleListRowCard
 */
export const SMART_RENAME_VARIABLES: TemplateVariableCategory[] = [
  {
    title: "Date & Time",
    variables: [
      { token: "{year}", desc: "4-digit year", example: "2026" },
      { token: "{month}", desc: "2-digit month", example: "01" },
      { token: "{day}", desc: "2-digit day", example: "30" },
      { token: "{hour}", desc: "2-digit hour", example: "14" },
      { token: "{minute}", desc: "2-digit minute", example: "35" },
      { token: "{second}", desc: "2-digit second", example: "22" },
    ],
  },
  {
    title: "File Info",
    variables: [
      {
        token: "{original_name}",
        desc: "Full filename with extension",
        example: "report.pdf",
      },
      {
        token: "{basename}",
        desc: "Filename without extension",
        example: "report",
      },
      { token: "{ext}", desc: "File extension (lowercase)", example: "pdf" },
    ],
  },
  {
    title: "Source Info",
    variables: [
      {
        token: "{domain}",
        desc: "Full domain name",
        example: "files.example.com",
      },
      {
        token: "{hostname}",
        desc: "Top-level domain",
        example: "example.com",
      },
    ],
  },
];

/**
 * Flattened list of smart rename variables for quick chip display
 */
export const SMART_RENAME_VARIABLE_CHIPS: TemplateVariable[] =
  SMART_RENAME_VARIABLES.flatMap((category) => category.variables);

/**
 * Path template tokens (for folder path patterns)
 * Used in Preview component
 */
export const PATH_TEMPLATE_TOKENS: TemplateVariableCategory[] = [
  {
    title: "Basic",
    variables: [
      { token: "{host}", desc: "Domain name" },
      { token: "{file}", desc: "Full filename" },
      { token: "{basename}", desc: "Without extension" },
      { token: "{ext}", desc: "Extension only" },
    ],
  },
  {
    title: "Date",
    variables: [
      { token: "{yyyy-mm-dd}", desc: "Full date" },
      { token: "{yyyy}", desc: "Year" },
      { token: "{mm}", desc: "Month" },
      { token: "{dd}", desc: "Day" },
    ],
  },
  {
    title: "URL",
    variables: [
      { token: "{path[0]}", desc: "First path segment" },
      { token: "{query.foo}", desc: "Query param" },
    ],
  },
];
