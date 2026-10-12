import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getPreferenceValues } from "@raycast/api";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type McpTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: {
    type?: string;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
  };
};

export type JsonSchemaProperty = {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: unknown[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  anyOf?: JsonSchemaProperty[];
  oneOf?: JsonSchemaProperty[];
  default?: unknown;
  format?: string;
};

type ExtensionPreferences = {
  mcpDirectory: string;
  nodeExecutable: string;
};

export type ToolResult = {
  isError?: boolean;
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
};

export function resultData<T>(result: ToolResult): T {
  const structured = result.structuredContent;
  if (structured && typeof structured === "object" && "data" in structured) {
    return (structured as { data: T }).data;
  }
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (text) {
    const parsed = JSON.parse(text) as { data?: T } | T;
    if (parsed && typeof parsed === "object" && "data" in parsed) return parsed.data as T;
    return parsed as T;
  }
  return structured as T;
}

function getMcpConfig() {
  const preferences = getPreferenceValues<ExtensionPreferences>();
  const directory = preferences.mcpDirectory?.trim();
  const command = preferences.nodeExecutable?.trim() || "node";

  if (!directory) throw new Error("Configura la carpeta del MCP en Preferencias de Doscientos.");

  const script = join(directory, "scripts", "start-stdio.mjs");
  if (!existsSync(script)) {
    throw new Error(`No encuentro ${script}. Revisa la carpeta del MCP en Preferencias de Doscientos.`);
  }

  if (!existsSync(join(directory, ".env.local"))) {
    throw new Error(
      `Falta el archivo .env.local en ${directory}. El MCP lo necesita para conectarse a Doscientos; cópialo desde la configuración del MCP.`,
    );
  }

  return { directory, script, command };
}

/** Standard JSON payload for list-like tools. */
export type Page<T> = { items?: T[]; page?: { nextOffset?: number | null } };

export const BACKOFFICE_URL = "https://app.doscientos.es";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Opens one short-lived stdio session. The MCP loads its own .env.local from its project folder. */
export async function withMcp<T>(action: (client: Client) => Promise<T>): Promise<T> {
  const config = getMcpConfig();
  const transport = new StdioClientTransport({
    command: config.command,
    args: [config.script],
    cwd: config.directory,
    stderr: "pipe",
  });
  const client = new Client({ name: "doscientos-raycast", version: "1.0.0" });

  try {
    await client.connect(transport);
    return await action(client);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (detail.includes("ENOENT") || detail.includes("spawn")) {
      throw new Error(`No se pudo iniciar Node o el MCP. Comprueba Node y la ruta configurada. ${detail}`);
    }
    throw new Error(detail);
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function listMcpTools(): Promise<McpTool[]> {
  return withMcp(async (client) => {
    const result = await client.listTools();
    return result.tools as McpTool[];
  });
}

export async function callMcpTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  return withMcp(async (client) => {
    const result = (await client.callTool({ name, arguments: args })) as ToolResult;
    if (result.isError) {
      const message = result.content
        ?.map((item) => item.text)
        .filter(Boolean)
        .join("\n");
      throw new Error(message || `El MCP devolvió un error en ${name}.`);
    }
    return result;
  });
}

export function toolResultMarkdown(result: ToolResult): string {
  const value = result.structuredContent ?? result.content?.find((item) => item.type === "text")?.text;
  if (typeof value === "string") {
    try {
      return `\`\`\`json\n${JSON.stringify(JSON.parse(value), null, 2)}\n\`\`\``;
    } catch {
      return value;
    }
  }
  if (value === undefined) return "El MCP completó la acción sin devolver contenido.";
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

export function toolGroup(name: string): string {
  const value = name.toLowerCase();
  if (/lead|marketing|meta/.test(value)) return "Comercial y marketing";
  if (/client|company/.test(value)) return "Clientes y empresa";
  if (/project|task|snapshot|review/.test(value)) return "Proyectos y tareas";
  if (/proposal/.test(value)) return "Propuestas";
  if (/invoice|expense|finance|financial/.test(value)) return "Finanzas";
  if (/work|hour|member|team/.test(value)) return "Equipo y horas";
  if (/document/.test(value)) return "Documentos";
  if (/daily|weekly|operation/.test(value)) return "Operaciones";
  return "Otras herramientas";
}
