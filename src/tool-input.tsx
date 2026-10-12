import { Action, ActionPanel, Alert, Detail, Form, showToast, Toast, confirmAlert } from "@raycast/api";
import { useState } from "react";
import { callMcpTool, type JsonSchemaProperty, type McpTool, toolResultMarkdown } from "./mcp";

function getType(schema: JsonSchemaProperty): string {
  if (typeof schema.type === "string") return schema.type;
  if (Array.isArray(schema.type)) return schema.type.find((type) => type !== "null") ?? "string";
  const alternatives = schema.anyOf ?? schema.oneOf ?? [];
  return (alternatives.find((item) => item.type !== "null")?.type as string) ?? "string";
}

function getEnum(schema: JsonSchemaProperty): unknown[] | undefined {
  if (schema.enum) return schema.enum;
  const alternatives = schema.anyOf ?? schema.oneOf ?? [];
  const values = alternatives.flatMap((item) => item.enum ?? []);
  return values.length ? values : undefined;
}

function isNullable(schema: JsonSchemaProperty): boolean {
  return (
    (Array.isArray(schema.type) && schema.type.includes("null")) ||
    (schema.anyOf ?? schema.oneOf ?? []).some((item) => item.type === "null")
  );
}

function fieldId(key: string): string {
  return `field_${key.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function renderField(key: string, schema: JsonSchemaProperty, required: boolean) {
  const type = getType(schema);
  const title = schema.title || key;
  const info =
    [schema.description, isNullable(schema) ? "Escribe null para borrar este valor." : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const enumValues = getEnum(schema);
  const isComplex = type === "object" || type === "array";

  if (enumValues?.length) {
    return (
      <Form.Dropdown key={key} id={fieldId(key)} title={title} info={info}>
        {enumValues.map((value) => (
          <Form.Dropdown.Item key={String(value)} value={String(value)} title={String(value)} />
        ))}
      </Form.Dropdown>
    );
  }

  if (type === "boolean") {
    return (
      <Form.Checkbox
        key={key}
        id={fieldId(key)}
        title={title}
        label={required ? "Obligatorio" : "Activar"}
        info={info}
      />
    );
  }

  if (isComplex || schema.format === "textarea" || /notes|description|transcript|content|json/i.test(key)) {
    return (
      <Form.TextArea
        key={key}
        id={fieldId(key)}
        title={title}
        info={isComplex ? `${info ? `${info} ` : ""}Introduce JSON válido.` : info}
        placeholder={isComplex ? (type === "array" ? "[]" : "{}") : undefined}
      />
    );
  }

  return (
    <Form.TextField
      key={key}
      id={fieldId(key)}
      title={title}
      info={info}
      placeholder={required ? "Obligatorio" : "Opcional"}
    />
  );
}

function parseFormValues(tool: McpTool, values: Form.Values): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
    const value = values[fieldId(key)];
    const type = getType(schema);
    const enums = getEnum(schema);
    if (type === "boolean") {
      if (value !== undefined) result[key] = value === true;
      continue;
    }
    if (value === undefined || value === "") continue;
    if (isNullable(schema) && value === "null") {
      result[key] = null;
      continue;
    }
    if (type === "object" || type === "array") {
      try {
        const parsed = JSON.parse(String(value));
        if (
          (type === "array" && !Array.isArray(parsed)) ||
          (type === "object" && (parsed === null || Array.isArray(parsed) || typeof parsed !== "object"))
        ) {
          throw new Error(`El campo «${key}» debe ser ${type === "array" ? "una lista" : "un objeto"} JSON.`);
        }
        result[key] = parsed;
      } catch (error) {
        if (error instanceof SyntaxError) throw new Error(`El JSON del campo «${key}» no es válido.`);
        throw error;
      }
      continue;
    }
    if (enums?.length) {
      const matched = enums.find((option) => String(option) === String(value));
      result[key] = matched ?? value;
      continue;
    }
    if (type === "integer" || type === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || (type === "integer" && !Number.isInteger(parsed))) {
        throw new Error(`«${key}» debe ser ${type === "integer" ? "un número entero" : "un número"}.`);
      }
      result[key] = parsed;
      continue;
    }
    result[key] = value;
  }

  const missing = (tool.inputSchema.required ?? []).filter((key) => result[key] === undefined);
  if (missing.length) throw new Error(`Completa los campos obligatorios: ${missing.join(", ")}.`);
  return result;
}

export function ToolInput({ tool }: { tool: McpTool }) {
  const [isLoading, setIsLoading] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState<string>();
  const properties = tool.inputSchema.properties ?? {};
  const isWrite = tool.annotations?.readOnlyHint !== true;
  const isDestructive = tool.annotations?.destructiveHint === true;

  async function submit(values: Form.Values) {
    let args: Record<string, unknown>;
    try {
      args = parseFormValues(tool, values);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Revisa los campos",
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    if (isWrite) {
      const approved = await confirmAlert({
        title: `¿Ejecutar ${tool.name}?`,
        message: "Esta herramienta modificará datos en Doscientos. Revisa los valores antes de continuar.",
        primaryAction: {
          title: "Ejecutar acción",
          style: isDestructive ? Alert.ActionStyle.Destructive : Alert.ActionStyle.Default,
        },
      });
      if (!approved) return;
    }

    setIsLoading(true);
    try {
      const result = await callMcpTool(tool.name, args);
      await showToast({ style: Toast.Style.Success, title: "MCP completado", message: tool.name });
      setResultMarkdown(toolResultMarkdown(result));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error del MCP",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const required = new Set(tool.inputSchema.required ?? []);
  const fields = Object.entries(properties).map(([key, schema]) => renderField(key, schema, required.has(key)));

  if (resultMarkdown) {
    return (
      <Detail
        navigationTitle={tool.title || tool.name}
        markdown={resultMarkdown}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copiar Resultado" content={resultMarkdown} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      navigationTitle={tool.title || tool.name.replaceAll("_", " ")}
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isWrite ? "Revisar Y Ejecutar" : "Consultar MCP"}
            onSubmit={(values) => void submit(values)}
          />
        </ActionPanel>
      }
    >
      {tool.description ? <Form.Description text={tool.description} /> : null}
      {fields.length ? fields : <Form.Description text="Esta herramienta no requiere parámetros." />}
    </Form>
  );
}
