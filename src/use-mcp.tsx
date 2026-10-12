import { Action, ActionPanel, Icon, List, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { callMcpTool, errorMessage, resultData } from "./mcp";

/** Cached read with stale-while-revalidate: instant reopen, refreshed in the background. */
export function useMcpRead<T>(tool: string, args: Record<string, unknown> = {}, options?: { execute?: boolean }) {
  return useCachedPromise(
    async (name: string, input: Record<string, unknown>) => resultData<T>(await callMcpTool(name, input)),
    [tool, args],
    { keepPreviousData: true, execute: options?.execute ?? true },
  );
}

/** Runs a write tool with a toast. Returns the tool data, or undefined when it fails. */
export async function runWrite<T = unknown>(
  tool: string,
  args: Record<string, unknown>,
  messages: { loading: string; success: string },
): Promise<T | undefined> {
  const toast = await showToast({ style: Toast.Style.Animated, title: messages.loading });
  try {
    const data = resultData<T>(await callMcpTool(tool, args));
    toast.style = Toast.Style.Success;
    toast.title = messages.success;
    return data;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "No se pudo completar";
    toast.message = errorMessage(error);
    return undefined;
  }
}

export function ErrorEmpty({ title, error, onRetry }: { title: string; error: Error; onRetry: () => void }) {
  return (
    <List.EmptyView
      icon={Icon.ExclamationMark}
      title={title}
      description={error.message}
      actions={
        <ActionPanel>
          <Action title="Reintentar" icon={Icon.ArrowClockwise} onAction={onRetry} />
          <Action title="Abrir Preferencias" icon={Icon.Gear} onAction={() => void openExtensionPreferences()} />
        </ActionPanel>
      }
    />
  );
}

export const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString("es-ES") : "");
export const formatMoney = (value?: number | string | null) =>
  value === undefined || value === null || value === ""
    ? ""
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));
