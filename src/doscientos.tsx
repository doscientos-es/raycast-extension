import { Action, ActionPanel, Icon, List } from "@raycast/api";
import BuscarLeads from "./buscar-leads";
import ExplorarMcp from "./explorar-mcp";
import OperativaDiaria from "./operativa-diaria";

export default function Command() {
  return (
    <List navigationTitle="Doscientos" searchBarPlaceholder="¿Qué necesitas hacer?">
      <List.Section title="Accesos rápidos">
        <List.Item
          icon={Icon.Person}
          title="Buscar leads"
          subtitle="Busca, filtra y abre fichas del CRM"
          actions={
            <ActionPanel>
              <Action.Push title="Ver Leads" target={<BuscarLeads />} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Clock}
          title="Operativa diaria"
          subtitle="Prioridades, tareas urgentes y facturas vencidas"
          actions={
            <ActionPanel>
              <Action.Push title="Ver Prioridades" target={<OperativaDiaria />} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.WrenchScrewdriver}
          title="Todas las herramientas MCP"
          subtitle="Explora las consultas y acciones disponibles"
          actions={
            <ActionPanel>
              <Action.Push title="Explorar Herramientas" target={<ExplorarMcp />} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
