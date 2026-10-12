import { Action, ActionPanel, Icon, List, openExtensionPreferences } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { listMcpTools, toolGroup, type McpTool } from "./mcp";
import { ToolInput } from "./tool-input";

export default function Command() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    listMcpTools()
      .then(setTools)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setIsLoading(false));
  }, []);

  const sections = useMemo(() => {
    const grouped = new Map<string, McpTool[]>();
    for (const tool of tools) {
      const group = toolGroup(tool.name);
      grouped.set(group, [...(grouped.get(group) ?? []), tool]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [tools]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Busca una herramienta del MCP…">
      {error ? (
        <List.EmptyView
          title="No se pudo conectar al MCP"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Abrir Preferencias" onAction={() => void openExtensionPreferences()} />
            </ActionPanel>
          }
        />
      ) : null}
      {!error && !isLoading && tools.length === 0 ? <List.EmptyView title="El MCP no anunció herramientas" /> : null}
      {sections.map(([group, items]) => (
        <List.Section key={group} title={group} subtitle={`${items.length}`}>
          {items.map((tool) => {
            const readOnly = tool.annotations?.readOnlyHint === true;
            return (
              <List.Item
                key={tool.name}
                icon={readOnly ? Icon.Eye : Icon.Pencil}
                title={tool.title || tool.name.replaceAll("_", " ")}
                subtitle={tool.description}
                accessories={[{ text: readOnly ? "Consulta" : "Modifica datos" }]}
                detail={
                  <List.Item.Detail
                    markdown={`## ${tool.title || tool.name}\n\n${tool.description || "Sin descripción."}\n\n**Parámetros:** ${Object.keys(tool.inputSchema.properties ?? {}).length}`}
                  />
                }
                actions={
                  <ActionPanel>
                    <Action.Push
                      title={readOnly ? "Abrir Consulta" : "Abrir Acción"}
                      icon={Icon.ArrowRight}
                      target={<ToolInput tool={tool} />}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ))}
    </List>
  );
}
