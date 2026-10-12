import { Action, ActionPanel, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useRef, useState } from "react";
import { randomUUID } from "node:crypto";
import { runWrite } from "./use-mcp";

type Values = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
};

const clean = (value: string) => value.trim() || undefined;

export default function Command() {
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  // One key per form session: re-submitting after a timeout cannot create a duplicate lead.
  const idempotencyKey = useRef(randomUUID());

  async function submit(values: Values) {
    if (!values.name.trim()) {
      setNameError("El nombre es obligatorio");
      await showToast({ style: Toast.Style.Failure, title: "Falta el nombre" });
      return;
    }
    setSaving(true);
    const created = await runWrite(
      "create_lead",
      {
        name: values.name.trim(),
        company: clean(values.company),
        email: clean(values.email),
        phone: clean(values.phone),
        source: clean(values.source),
        notes: clean(values.notes),
        idempotencyKey: idempotencyKey.current,
      },
      { loading: "Creando lead…", success: "Lead creado" },
    );
    setSaving(false);
    if (created !== undefined) await popToRoot();
  }

  return (
    <Form
      isLoading={saving}
      navigationTitle="Nuevo lead"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Crear Lead" icon={Icon.AddPerson} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Nombre"
        placeholder="Persona de contacto"
        error={nameError}
        onChange={() => setNameError(undefined)}
      />
      <Form.TextField id="company" title="Empresa" />
      <Form.TextField id="email" title="Email" />
      <Form.TextField id="phone" title="Teléfono" />
      <Form.TextField id="source" title="Origen" placeholder="Web, recomendación, evento…" />
      <Form.TextArea id="notes" title="Notas" enableMarkdown={false} />
    </Form>
  );
}
