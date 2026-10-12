import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import { ErrorEmpty, formatDate, useMcpRead } from "./use-mcp";

type Client = { id: string; name: string; contactPerson?: string; updatedAt?: string };

export default function Command() {
  const [query, setQuery] = useState("");
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Client>>("search_clients", {
    query: query.trim() || undefined,
    limit: 50,
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar cliente…"
    >
      {error ? <ErrorEmpty title="No se pudieron cargar los clientes" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && !data?.items?.length ? <List.EmptyView title="No hay clientes" /> : null}
      {(data?.items ?? []).map((client) => (
        <List.Item
          key={client.id}
          icon={Icon.Building}
          title={client.name}
          subtitle={client.contactPerson}
          accessories={client.updatedAt ? [{ text: formatDate(client.updatedAt), icon: Icon.Calendar }] : []}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Abrir En Doscientos" url={`${BACKOFFICE_URL}/clients/${client.id}`} />
              <Action.CopyToClipboard title="Copiar Nombre" content={client.name} />
              <Action.CopyToClipboard title="Copiar ID Del Cliente" content={client.id} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
