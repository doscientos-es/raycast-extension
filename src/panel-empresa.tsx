import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { BACKOFFICE_URL, Page } from "./mcp";
import { formatDate, formatMoney, useMcpRead } from "./use-mcp";

type Summary = { clients?: number; leads?: number; invoices?: number; projects?: number };
type Pipeline = { total?: number; open?: number; byStatus?: Record<string, number> };
type Overdue = { id: string; full_number?: string; client_name?: string; total?: number | string; due_date?: string };

const statusTitles: Record<string, string> = {
  new: "Nuevos",
  qualifying: "Cualificando",
  contacted: "Contactados",
  in_conversation: "En conversación",
  quoted: "Con propuesta",
  won: "Ganados",
  lost: "Perdidos",
  archived: "Archivados",
  not_interested: "Sin interés",
};

export default function Command() {
  const summary = useMcpRead<Summary>("get_company_summary");
  const pipeline = useMcpRead<Pipeline>("get_pipeline_summary");
  const overdue = useMcpRead<Page<Overdue>>("get_overdue_invoices", { limit: 10 });

  const isLoading = summary.isLoading || pipeline.isLoading || overdue.isLoading;
  const errors = [summary.error, pipeline.error, overdue.error].filter(Boolean) as Error[];

  const stages = Object.entries(pipeline.data?.byStatus ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `| ${statusTitles[status] ?? status} | ${count} |`);
  const invoices = overdue.data?.items ?? [];

  const markdown = [
    "# Panel de Doscientos",
    summary.data
      ? [
          "## Empresa",
          "| Clientes | Leads | Proyectos | Facturas |",
          "| --- | --- | --- | --- |",
          `| ${summary.data.clients ?? 0} | ${summary.data.leads ?? 0} | ${summary.data.projects ?? 0} | ${summary.data.invoices ?? 0} |`,
        ].join("\n")
      : "",
    pipeline.data
      ? [
          `## Pipeline comercial · ${pipeline.data.open ?? 0} abiertos de ${pipeline.data.total ?? 0}`,
          "| Estado | Leads |",
          "| --- | --- |",
          ...stages,
        ].join("\n")
      : "",
    overdue.data
      ? invoices.length
        ? [
            `## Facturas vencidas (${invoices.length})`,
            "| Factura | Cliente | Importe | Vence |",
            "| --- | --- | --- | --- |",
            ...invoices.map(
              (item) =>
                `| ${item.full_number ?? "—"} | ${item.client_name ?? "—"} | ${formatMoney(item.total)} | ${formatDate(item.due_date) || "—"} |`,
            ),
          ].join("\n")
        : "## Facturas vencidas\n\nNo hay facturas vencidas. 🎉"
      : "",
    errors.length ? `## Avisos\n\n${errors.map((error) => `- ${error.message}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const reload = () => {
    summary.revalidate();
    pipeline.revalidate();
    overdue.revalidate();
  };

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle="Panel de empresa"
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={reload} />
          <Action.OpenInBrowser title="Abrir Inicio De Doscientos" url={`${BACKOFFICE_URL}/inicio`} />
        </ActionPanel>
      }
    />
  );
}
