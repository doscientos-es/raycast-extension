import { Action, ActionPanel, Form, Icon, LocalStorage, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { Page } from "./mcp";
import { runWrite, useMcpRead } from "./use-mcp";

type Project = { id: string; name: string; status?: string };
type Values = { projectId: string; hours: string; note: string; workDate: Date | null };

const LAST_PROJECT = "last-project";

export default function Command() {
  const { data, isLoading, error } = useMcpRead<Page<Project>>("search_projects", { limit: 50 });
  const [projectId, setProjectId] = useState<string>();
  const [hoursError, setHoursError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const projects = data?.items ?? [];

  useEffect(() => {
    void LocalStorage.getItem<string>(LAST_PROJECT).then((value) => value && setProjectId(value));
  }, []);

  async function submit(values: Values) {
    const hours = Number(values.hours.replace(",", "."));
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      setHoursError("Indica horas entre 0 y 24, por ejemplo 2 o 1,5");
      return;
    }
    if (!values.projectId) {
      await showToast({ style: Toast.Style.Failure, title: "Elige un proyecto" });
      return;
    }
    setSaving(true);
    const logged = await runWrite(
      "log_work_hours",
      {
        projectId: values.projectId,
        hours,
        note: values.note.trim() || undefined,
        workDate: values.workDate ? values.workDate.toISOString().slice(0, 10) : undefined,
      },
      { loading: "Registrando horas…", success: `${hours} h registradas` },
    );
    setSaving(false);
    if (logged !== undefined) {
      await LocalStorage.setItem(LAST_PROJECT, values.projectId);
      await popToRoot();
    }
  }

  return (
    <Form
      isLoading={isLoading || saving}
      navigationTitle="Registrar horas"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Registrar Horas" icon={Icon.Clock} onSubmit={submit} />
        </ActionPanel>
      }
    >
      {error ? <Form.Description title="Error" text={error.message} /> : null}
      <Form.Dropdown id="projectId" title="Proyecto" value={projectId ?? ""} onChange={setProjectId}>
        <Form.Dropdown.Item value="" title="Elige un proyecto" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="hours"
        title="Horas"
        placeholder="2"
        error={hoursError}
        onChange={() => setHoursError(undefined)}
      />
      <Form.DatePicker id="workDate" title="Fecha" type={Form.DatePicker.Type.Date} defaultValue={new Date()} />
      <Form.TextField id="note" title="Nota" placeholder="Qué hiciste (opcional)" />
    </Form>
  );
}
