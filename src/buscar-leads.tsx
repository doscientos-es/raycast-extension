import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { callMcpTool, resultData } from "./mcp";

type Lead = {
  id: string;
  name?: string;
  company?: string;
  status?: string;
  temperature?: string;
  score?: number;
  ai_suggested_next_step?: string;
  aiSuggestedNextStep?: string;
  updated_at?: string;
  updatedAt?: string;
};

type LeadPage = { items?: Lead[]; page?: { nextOffset?: number | null } };

const statuses = [
  { value: "all", title: "Todos los estados" },
  { value: "new", title: "Nuevos" },
  { value: "qualifying", title: "Cualificando" },
  { value: "contacted", title: "Contactados" },
  { value: "in_conversation", title: "En conversación" },
  { value: "quoted", title: "Con propuesta" },
  { value: "won", title: "Ganados" },
  { value: "lost", title: "Perdidos" },
  { value: "archived", title: "Archivados" },
  { value: "not_interested", title: "Sin interés" },
];

const backoffice = "https://app.doscientos.es";
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString("es-ES") : "");

export default function Command() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(undefined);
    callMcpTool("search_leads", {
      query: query.trim() || undefined,
      status: status === "all" ? undefined : status,
      limit: 50,
      offset: page * 50,
    })
      .then((result) => {
        if (id !== requestId.current) return;
        const data = resultData<LeadPage>(result);
        setLeads((previous) => (page === 0 ? (data.items ?? []) : [...previous, ...(data.items ?? [])]));
        setHasMore(data.page?.nextOffset != null);
      })
      .catch((reason: unknown) => {
        if (id === requestId.current) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        if (id === requestId.current) setIsLoading(false);
      });
  }, [query, status, page]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={changeQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar por persona o empresa…"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filtrar por estado"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
        >
          {statuses.map((item) => (
            <List.Dropdown.Item key={item.value} value={item.value} title={item.title} />
          ))}
        </List.Dropdown>
      }
      pagination={{
        hasMore,
        pageSize: 50,
        onLoadMore: () => {
          if (!isLoading && hasMore) setPage((current) => current + 1);
        },
      }}
    >
      {error ? <List.EmptyView title="No se pudieron cargar los leads" description={error} /> : null}
      {!error && !isLoading && leads.length === 0 ? (
        <List.EmptyView
          title="No hay leads que coincidan"
          description="Prueba otro nombre o cambia el filtro de estado."
        />
      ) : null}
      {leads.map((lead) => {
        const statusTitle = statuses.find((item) => item.value === lead.status)?.title ?? lead.status ?? "Sin estado";
        const nextStep = lead.ai_suggested_next_step ?? lead.aiSuggestedNextStep;
        const updated = formatDate(lead.updated_at ?? lead.updatedAt);
        const markdown = [
          `# ${lead.name || "Lead"}`,
          lead.company ? `**Empresa:** ${lead.company}` : "",
          `**Estado:** ${statusTitle}`,
          lead.temperature ? `**Temperatura:** ${lead.temperature}` : "",
          lead.score !== undefined ? `**Puntuación:** ${lead.score}` : "",
          updated ? `**Actualizado:** ${updated}` : "",
          nextStep ? `\n**Siguiente paso sugerido**\n\n${nextStep}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        return (
          <List.Item
            key={lead.id}
            icon={Icon.Person}
            title={lead.name || "Lead sin nombre"}
            subtitle={lead.company}
            accessories={[
              { text: statusTitle },
              ...(lead.score !== undefined ? [{ text: String(lead.score), icon: Icon.Star }] : []),
            ]}
            detail={<List.Item.Detail markdown={markdown} />}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Abrir En Doscientos" url={`${backoffice}/leads/${lead.id}`} />
                <Action.CopyToClipboard title="Copiar Nombre" content={lead.name ?? ""} />
                <Action.CopyToClipboard title="Copiar ID Del Lead" content={lead.id} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
