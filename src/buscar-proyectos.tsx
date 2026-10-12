import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import CrearTarea from "./crear-tarea";
import TareasProyecto from "./tareas-proyecto";
import { ErrorEmpty, formatDate, useMcpRead } from "./use-mcp";

type Project = {
  id: string;
  name: string;
  status?: string;
  startsAt?: string;
  updatedAt?: string;
  client?: { name?: string } | null;
};

export default function Command() {
  const [query, setQuery] = useState("");
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Project>>("search_projects", {
    query: query.trim() || undefined,
    limit: 50,
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar proyecto…"
    >
      {error ? <ErrorEmpty title="No se pudieron cargar los proyectos" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && !data?.items?.length ? <List.EmptyView title="No hay proyectos" /> : null}
      {(data?.items ?? []).map((project) => (
        <List.Item
          key={project.id}
          icon={Icon.Folder}
          title={project.name}
          subtitle={project.client?.name}
          accessories={[
            ...(project.status ? [{ tag: project.status }] : []),
            ...(project.updatedAt ? [{ text: formatDate(project.updatedAt), icon: Icon.Calendar }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Ver Tareas"
                icon={Icon.CheckList}
                target={<TareasProyecto projectId={project.id} projectName={project.name} />}
              />
              <Action.Push
                title="Nueva Tarea"
                icon={Icon.PlusCircle}
                shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
                target={<CrearTarea projectId={project.id} />}
              />
              <Action.OpenInBrowser title="Abrir En Doscientos" url={`${BACKOFFICE_URL}/projects/${project.id}`} />
              <Action.CopyToClipboard title="Copiar ID Del Proyecto" content={project.id} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
