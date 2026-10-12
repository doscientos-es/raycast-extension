import { Action, ActionPanel, Icon, List, openExtensionPreferences } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { listMcpTools, toolGroup, type McpTool } from "./mcp";
import { ToolInput } from "./tool-input";

export default function Command() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(undefined);
    listMcpTools()
      .then((result) => {
        if (active) setTools(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

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
              <Action
                title="Reintentar Conexión"
                icon={Icon.ArrowClockwise}
                onAction={() => setReloadKey((key) => key + 1)}
              />
              <Action title="Abrir Preferencias" onAction={() => void openExtensionPreferences()} />
            </ActionPanel>
          }
        />
      ) : null}
      {!error && !isLoading && tools.length === 0 ? (
        <List.EmptyView
          title="El MCP no anunció herramientas"
          description="Comprueba que el servidor MCP esté actualizado y vuelve a cargar la lista."
          actions={
            <ActionPanel>
              <Action
                title="Actualizar Herramientas"
                icon={Icon.ArrowClockwise}
                onAction={() => setReloadKey((key) => key + 1)}
              />
              <Action title="Abrir Preferencias" onAction={() => void openExtensionPreferences()} />
            </ActionPanel>
          }
        />
      ) : null}
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
                    <Action
                      title="Actualizar Herramientas"
                      icon={Icon.ArrowClockwise}
                      onAction={() => setReloadKey((key) => key + 1)}
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
