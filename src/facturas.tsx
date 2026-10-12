import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import { ErrorEmpty, formatDate, formatMoney, useMcpRead } from "./use-mcp";

type Invoice = {
  id: string;
  full_number?: string;
  status?: string;
  issue_date?: string;
  total?: number | string;
  client_name?: string;
};

const filters = [
  { value: "pending", title: "Pendientes de cobro" },
  { value: "overdue", title: "Vencidas" },
  { value: "paid", title: "Pagadas" },
  { value: "draft", title: "Borradores" },
  { value: "all", title: "Todas" },
];

const statusColor: Record<string, Color> = {
  overdue: Color.Red,
  paid: Color.Green,
  issued: Color.Blue,
  draft: Color.SecondaryText,
};

export default function Command() {
  const [filter, setFilter] = useState("pending");
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Invoice>>("list_invoices", {
    pendingOnly: filter === "pending",
    status: ["overdue", "paid", "draft"].includes(filter) ? filter : undefined,
    limit: 50,
  });

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filtrar por número o cliente…"
      searchBarAccessory={
        <List.Dropdown tooltip="Filtrar facturas" value={filter} onChange={setFilter}>
          {filters.map((item) => (
            <List.Dropdown.Item key={item.value} value={item.value} title={item.title} />
          ))}
        </List.Dropdown>
      }
    >
      {error ? <ErrorEmpty title="No se pudieron cargar las facturas" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && !data?.items?.length ? <List.EmptyView title="No hay facturas con este filtro" /> : null}
      {(data?.items ?? []).map((invoice) => (
        <List.Item
          key={invoice.id}
          icon={{ source: Icon.Receipt, tintColor: statusColor[invoice.status ?? ""] }}
          title={invoice.full_number || "Sin número"}
          subtitle={invoice.client_name}
          keywords={[invoice.client_name ?? "", invoice.full_number ?? ""]}
          accessories={[
            ...(invoice.status ? [{ tag: { value: invoice.status, color: statusColor[invoice.status] } }] : []),
            { text: formatMoney(invoice.total) },
            ...(invoice.issue_date ? [{ text: formatDate(invoice.issue_date) }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Abrir En Doscientos" url={`${BACKOFFICE_URL}/invoices/${invoice.id}`} />
              <Action.CopyToClipboard title="Copiar Número" content={invoice.full_number ?? invoice.id} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
