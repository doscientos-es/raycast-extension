import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import { ErrorEmpty, formatDate, formatMoney, useMcpRead } from "./use-mcp";

type Proposal = {
  id: string;
  number?: string;
  title?: string;
  status?: string;
  total?: number | string;
  validUntil?: string;
  lead?: { name?: string; company?: string | null } | null;
};

const filters = [
  { value: "open", title: "Abiertas (enviadas y vistas)" },
  { value: "draft", title: "Borradores" },
  { value: "accepted", title: "Aceptadas" },
  { value: "rejected", title: "Rechazadas" },
  { value: "expired", title: "Caducadas" },
  { value: "all", title: "Todas" },
];

const statusColor: Record<string, Color> = {
  draft: Color.SecondaryText,
  sent: Color.Blue,
  viewed: Color.Orange,
  accepted: Color.Green,
  rejected: Color.Red,
  expired: Color.Yellow,
};

export default function Command() {
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const status = ["draft", "accepted", "rejected", "expired"].includes(filter) ? filter : undefined;
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Proposal>>("search_proposals", {
    query: query.trim() || undefined,
    status,
    limit: 50,
  });
  const items = (data?.items ?? []).filter(
    (item) => filter !== "open" || item.status === "sent" || item.status === "viewed",
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar propuesta por título o número…"
      searchBarAccessory={
        <List.Dropdown tooltip="Filtrar propuestas" value={filter} onChange={setFilter}>
          {filters.map((item) => (
            <List.Dropdown.Item key={item.value} value={item.value} title={item.title} />
          ))}
        </List.Dropdown>
      }
    >
      {error ? <ErrorEmpty title="No se pudieron cargar las propuestas" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && items.length === 0 ? <List.EmptyView title="No hay propuestas con este filtro" /> : null}
      {items.map((proposal) => (
        <List.Item
          key={proposal.id}
          icon={{ source: Icon.Document, tintColor: statusColor[proposal.status ?? ""] }}
          title={proposal.title || "Sin título"}
          subtitle={[proposal.number, proposal.lead?.name].filter(Boolean).join(" · ")}
          accessories={[
            ...(proposal.status ? [{ tag: { value: proposal.status, color: statusColor[proposal.status] } }] : []),
            { text: formatMoney(proposal.total) },
            ...(proposal.validUntil ? [{ text: `Hasta ${formatDate(proposal.validUntil)}` }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Abrir En Doscientos" url={`${BACKOFFICE_URL}/proposals/${proposal.id}`} />
              <Action.CopyToClipboard title="Copiar Número" content={proposal.number ?? proposal.id} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
