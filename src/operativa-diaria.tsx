import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { callMcpTool, resultData } from "./mcp";

type Priority = Record<string, unknown>;
type DailyOperations = { summary?: Record<string, number>; priorities?: Priority[] };
const backoffice = "https://app.doscientos.es";
const value = (row: Priority, camel: string, snake: string) => row[camel] ?? row[snake];

function priorityUrl(item: Priority): string {
  const id = String(item.id ?? "");
  const kind = String(item.kind ?? "").toLowerCase();
  if (kind.includes("invoice")) return `${backoffice}/invoices/${id}`;
  if (kind.includes("proposal")) return `${backoffice}/proposals/${id}`;
  if (kind.includes("project")) return `${backoffice}/projects/${id}`;
  return item.projectId || item.project_id
    ? `${backoffice}/projects/${String(item.projectId ?? item.project_id)}/tasks`
    : `${backoffice}/tasks`;
}

export default function Command() {
  const [data, setData] = useState<DailyOperations>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    callMcpTool("get_daily_operations")
      .then((result) => setData(resultData<DailyOperations>(result)))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setIsLoading(false));
  }, []);

  const summary = data?.summary ?? {};
  const priorities = data?.priorities ?? [];

  return (
    <List isLoading={isLoading} navigationTitle="Operativa diaria" searchBarPlaceholder="Filtrar prioridades…">
      {error ? <List.EmptyView title="No se pudo cargar la operativa" description={error} /> : null}
      {data ? (
        <List.Section title="Resumen">
          <List.Item
            icon={Icon.ExclamationMark}
            title={`${summary.urgentTasks ?? 0} tareas urgentes · ${summary.overdueInvoices ?? 0} facturas vencidas`}
            subtitle={`${summary.pendingProposals ?? 0} propuestas pendientes · ${summary.overdueProjects ?? 0} proyectos fuera de fecha`}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Abrir Inicio De Doscientos" url={`${backoffice}/inicio`} />
              </ActionPanel>
            }
          />
        </List.Section>
      ) : null}
      {priorities.length ? (
        <List.Section title="Prioridades">
          {priorities.map((item, index) => {
            const kind = String(item.kind ?? "Prioridad");
            const id = String(item.id ?? index);
            const title = String(
              item.title ?? item.full_number ?? item.fullNumber ?? item.name ?? `${kind} ${index + 1}`,
            );
            const detail = [
              kind,
              value(item, "reason", "reason"),
              value(item, "dueDate", "due_date"),
              (item.projects as Record<string, unknown> | undefined)?.name,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <List.Item
                key={`${kind}-${id}`}
                title={title}
                subtitle={detail}
                icon={Icon.Clock}
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser title="Abrir En Doscientos" url={priorityUrl(item)} />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ) : data && !isLoading ? (
        <List.EmptyView title="No hay prioridades pendientes" />
      ) : null}
    </List>
  );
}
