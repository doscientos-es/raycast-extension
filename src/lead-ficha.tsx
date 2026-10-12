import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { BACKOFFICE_URL } from "./mcp";
import { useMcpRead } from "./use-mcp";

function section(title: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  const body = typeof value === "string" ? value : "```json\n" + JSON.stringify(value, null, 2) + "\n```";
  return `## ${title}\n\n${body}`;
}

export default function LeadFicha({ leadId, name }: { leadId: string; name?: string }) {
  const context = useMcpRead<Record<string, unknown>>("get_lead_sales_context", { leadId, interactionLimit: 10 });
  const brief = useMcpRead<Record<string, unknown>>("get_lead_demo_brief", { leadId }, { execute: false });

  const markdown = [
    `# ${name ?? "Lead"}`,
    context.error ? `> ${context.error.message}` : "",
    section("Contexto de venta", context.data),
    section("Brief para demo", brief.data),
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <Detail
      isLoading={context.isLoading || brief.isLoading}
      navigationTitle={name ?? "Ficha del lead"}
      markdown={markdown || "Cargando contexto de venta…"}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Abrir En Doscientos" url={`${BACKOFFICE_URL}/leads/${leadId}`} />
          <Action
            title="Cargar Brief Para Demo"
            icon={Icon.Wand}
            shortcut={{ modifiers: ["cmd"], key: "b" }}
            onAction={() => brief.revalidate()}
          />
          <Action.CopyToClipboard title="Copiar Contexto" content={JSON.stringify(context.data ?? {}, null, 2)} />
          <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={() => context.revalidate()} />
        </ActionPanel>
      }
    />
  );
}
