import { Icon, launchCommand, LaunchType, MenuBarExtra, open, openExtensionPreferences } from "@raycast/api";
import { BACKOFFICE_URL } from "./mcp";
import { useMcpRead } from "./use-mcp";

type DailyOperations = { summary?: Record<string, number> };

export default function Command() {
  const { data, isLoading, error } = useMcpRead<DailyOperations>("get_daily_operations");
  const summary = data?.summary ?? {};
  const urgent = summary.urgentTasks ?? 0;
  const overdue = summary.overdueInvoices ?? 0;
  const proposals = summary.pendingProposals ?? 0;
  const total = urgent + overdue;

  const launch = (name: string) => () => void launchCommand({ name, type: LaunchType.UserInitiated });

  return (
    <MenuBarExtra
      isLoading={isLoading}
      icon={Icon.Bolt}
      title={error ? "!" : total > 0 ? String(total) : undefined}
      tooltip="Doscientos · operativa diaria"
    >
      {error ? (
        <MenuBarExtra.Section title="No se pudo conectar con el MCP">
          <MenuBarExtra.Item title={error.message.slice(0, 80)} />
          <MenuBarExtra.Item
            title="Abrir Preferencias"
            icon={Icon.Gear}
            onAction={() => void openExtensionPreferences()}
          />
        </MenuBarExtra.Section>
      ) : (
        <MenuBarExtra.Section title="Hoy">
          <MenuBarExtra.Item
            title={`${urgent} tareas urgentes`}
            icon={Icon.ExclamationMark}
            onAction={launch("operativa-diaria")}
          />
          <MenuBarExtra.Item title={`${overdue} facturas vencidas`} icon={Icon.Receipt} onAction={launch("facturas")} />
          <MenuBarExtra.Item
            title={`${proposals} propuestas pendientes`}
            icon={Icon.Document}
            onAction={launch("operativa-diaria")}
          />
        </MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section title="Acciones rápidas">
        <MenuBarExtra.Item title="Nuevo lead" icon={Icon.AddPerson} onAction={launch("crear-lead")} />
        <MenuBarExtra.Item title="Registrar horas" icon={Icon.Clock} onAction={launch("registrar-horas")} />
        <MenuBarExtra.Item title="Nueva tarea" icon={Icon.PlusCircle} onAction={launch("crear-tarea")} />
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Abrir Doscientos"
          icon={Icon.Globe}
          onAction={() => void open(`${BACKOFFICE_URL}/inicio`)}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
