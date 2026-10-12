import { Action, ActionPanel, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useRef, useState } from "react";
import { randomUUID } from "node:crypto";
import { Page } from "./mcp";
import { runWrite, useMcpRead } from "./use-mcp";

type Project = { id: string; name: string };
type Values = {
  projectId: string;
  title: string;
  description: string;
  priority: string;
  dueDate: Date | null;
};

export default function Command({ projectId: initialProject }: { projectId?: string }) {
  const { data, isLoading, error } = useMcpRead<Page<Project>>("search_projects", { limit: 50 });
  const [titleError, setTitleError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef(randomUUID());
  const projects = data?.items ?? [];

  async function submit(values: Values) {
    if (!values.title.trim()) {
      setTitleError("El título es obligatorio");
      return;
    }
    if (!values.projectId) {
      await showToast({ style: Toast.Style.Failure, title: "Elige un proyecto" });
      return;
    }
    setSaving(true);
    const created = await runWrite(
      "create_project_task",
      {
        projectId: values.projectId,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        priority: values.priority || undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString().slice(0, 10) : undefined,
        idempotencyKey: idempotencyKey.current,
      },
      { loading: "Creando tarea…", success: "Tarea creada" },
    );
    setSaving(false);
    if (created !== undefined) await popToRoot();
  }

  return (
    <Form
      isLoading={isLoading || saving}
      navigationTitle="Nueva tarea"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Crear Tarea" icon={Icon.PlusCircle} onSubmit={submit} />
        </ActionPanel>
      }
    >
      {error ? <Form.Description title="Error" text={error.message} /> : null}
      <Form.Dropdown id="projectId" title="Proyecto" defaultValue={initialProject ?? ""}>
        <Form.Dropdown.Item value="" title="Elige un proyecto" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="title" title="Título" error={titleError} onChange={() => setTitleError(undefined)} />
      <Form.TextArea id="description" title="Descripción" />
      <Form.Dropdown id="priority" title="Prioridad" defaultValue="medium">
        <Form.Dropdown.Item value="low" title="Baja" />
        <Form.Dropdown.Item value="medium" title="Media" />
        <Form.Dropdown.Item value="high" title="Alta" />
        <Form.Dropdown.Item value="urgent" title="Urgente" />
      </Form.Dropdown>
      <Form.DatePicker id="dueDate" title="Fecha límite" type={Form.DatePicker.Type.Date} />
    </Form>
  );
}
