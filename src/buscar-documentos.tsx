import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import { ErrorEmpty, formatDate, useMcpRead } from "./use-mcp";

type Doc = {
  id: string;
  name: string;
  category?: string;
  updated_at?: string;
  backofficeUrl?: string;
  backofficePath?: string;
};

const categories = [
  { value: "all", title: "Todas las categorías" },
  { value: "legal", title: "Legal" },
  { value: "hr", title: "RR. HH." },
  { value: "finance", title: "Finanzas" },
  { value: "templates", title: "Plantillas" },
  { value: "policies", title: "Políticas" },
  { value: "meetings", title: "Reuniones" },
  { value: "other", title: "Otros" },
];

function docUrl(doc: Doc) {
  if (doc.backofficeUrl) return doc.backofficeUrl;
  return `${BACKOFFICE_URL}${doc.backofficePath ?? `/documents/${doc.id}`}`;
}

export default function Command() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Doc>>("search_internal_documents", {
    query: query.trim() || undefined,
    category: category === "all" ? undefined : category,
    limit: 50,
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar documento interno…"
      searchBarAccessory={
        <List.Dropdown tooltip="Categoría" value={category} onChange={setCategory}>
          {categories.map((item) => (
            <List.Dropdown.Item key={item.value} value={item.value} title={item.title} />
          ))}
        </List.Dropdown>
      }
    >
      {error ? <ErrorEmpty title="No se pudieron cargar los documentos" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && !data?.items?.length ? <List.EmptyView title="No hay documentos" /> : null}
      {(data?.items ?? []).map((doc) => (
        <List.Item
          key={doc.id}
          icon={Icon.Document}
          title={doc.name}
          accessories={[
            ...(doc.category ? [{ tag: doc.category }] : []),
            ...(doc.updated_at ? [{ text: formatDate(doc.updated_at) }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Abrir En Doscientos" url={docUrl(doc)} />
              <Action.CopyToClipboard title="Copiar Enlace" content={docUrl(doc)} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
