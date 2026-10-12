import {
  Action,
  ActionPanel,
  Color,
  confirmAlert,
  Alert,
  Form,
  Icon,
  List,
  useNavigation,
  Keyboard,
} from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import CrearTarea from "./crear-tarea";
import { ErrorEmpty, formatDate, runWrite, useMcpRead } from "./use-mcp";

type Task = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  due_date?: string | null;
  version: number;
};

const statuses: Array<{ value: string; title: string; icon: Icon; color: Color }> = [
  { value: "todo", title: "Por hacer", icon: Icon.Circle, color: Color.SecondaryText },
  { value: "in_progress", title: "En curso", icon: Icon.CircleProgress50, color: Color.Blue },
  { value: "in_review", title: "En revisión", icon: Icon.Eye, color: Color.Orange },
  { value: "done", title: "Hecha", icon: Icon.CheckCircle, color: Color.Green },
  { value: "cancelled", title: "Cancelada", icon: Icon.XMarkCircle, color: Color.Red },
];

function CommentForm({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Nota interna"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Añadir Nota"
            icon={Icon.Message}
            onSubmit={async (values: { body: string }) => {
              if (!values.body.trim()) return;
              const added = await runWrite(
                "add_task_comment",
                { taskId, body: values.body.trim(), confirm: true },
                { loading: "Añadiendo nota…", success: "Nota añadida (no se envió nada al cliente)" },
              );
              if (added !== undefined) {
                onDone();
                pop();
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Es una nota interna: no se comunica al cliente." />
      <Form.TextArea id="body" title="Nota" />
    </Form>
  );
}

export default function TareasProyecto({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [showDone, setShowDone] = useState(false);
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Task>>("list_project_tasks", {
    projectId,
    includeCompleted: showDone,
    limit: 100,
  });

  async function changeStatus(task: Task, status: string, title: string) {
    if (status === "cancelled") {
      const ok = await confirmAlert({
        title: `¿Cancelar "${task.title}"?`,
        primaryAction: { title: "Cancelar tarea", style: Alert.ActionStyle.Destructive },
      });
      if (!ok) return;
    }
    const updated = await runWrite(
      "set_task_status",
      { taskId: task.id, expectedVersion: task.version, status },
      { loading: "Actualizando…", success: `Estado: ${title}` },
    );
    if (updated !== undefined) revalidate();
  }

  return (
    <List isLoading={isLoading} navigationTitle={`Tareas · ${projectName}`} searchBarPlaceholder="Filtrar tareas…">
      {error ? <ErrorEmpty title="No se pudieron cargar las tareas" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && !data?.items?.length ? (
        <List.EmptyView
          title="Sin tareas"
          description="Este proyecto no tiene tareas abiertas."
          actions={
            <ActionPanel>
              <Action.Push title="Nueva Tarea" icon={Icon.PlusCircle} target={<CrearTarea projectId={projectId} />} />
            </ActionPanel>
          }
        />
      ) : null}
      {(data?.items ?? []).map((task) => {
        const current = statuses.find((item) => item.value === task.status) ?? statuses[0];
        return (
          <List.Item
            key={task.id}
            title={task.title}
            icon={{ source: current.icon, tintColor: current.color }}
            accessories={[
              ...(task.priority ? [{ tag: task.priority }] : []),
              ...(task.due_date ? [{ date: new Date(task.due_date), tooltip: formatDate(task.due_date) }] : []),
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="Cambiar estado">
                  {statuses
                    .filter((item) => item.value !== task.status)
                    .map((item) => (
                      <Action
                        key={item.value}
                        title={`Marcar ${item.title}`}
                        icon={item.icon}
                        onAction={() => void changeStatus(task, item.value, item.title)}
                      />
                    ))}
                </ActionPanel.Section>
                <Action.Push
                  title="Añadir Nota Interna"
                  icon={Icon.Message}
                  shortcut={Keyboard.Shortcut.Common.New}
                  target={<CommentForm taskId={task.id} onDone={revalidate} />}
                />
                <Action.Push
                  title="Nueva Tarea"
                  icon={Icon.PlusCircle}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
                  target={<CrearTarea projectId={projectId} />}
                />
                <Action
                  title={showDone ? "Ocultar Completadas" : "Mostrar Completadas"}
                  icon={Icon.Eye}
                  onAction={() => setShowDone((value) => !value)}
                />
                <Action.OpenInBrowser
                  title="Abrir Proyecto En Doscientos"
                  url={`${BACKOFFICE_URL}/projects/${projectId}/tasks`}
                />
                <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
