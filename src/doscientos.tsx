import { Action, ActionPanel, Icon, LaunchType, launchCommand, List, openExtensionPreferences } from "@raycast/api";
import { COMPANY } from "./constants";

type Entry = { command: string; icon: Icon; title: string; subtitle: string };

const sections: Array<{ title: string; entries: Entry[] }> = [
  {
    title: "Hoy",
    entries: [
      {
        command: "operativa-diaria",
        icon: Icon.Clock,
        title: "Operativa diaria",
        subtitle: "Prioridades, tareas urgentes y facturas vencidas",
      },
      {
        command: "panel-empresa",
        icon: Icon.BarChart,
        title: "Panel de empresa",
        subtitle: "Resumen, pipeline y facturas vencidas",
      },
    ],
  },
  {
    title: "Buscar",
    entries: [
      { command: "buscar-leads", icon: Icon.Person, title: "Buscar leads", subtitle: "CRM: filtra y abre fichas" },
      { command: "buscar-clientes", icon: Icon.Building, title: "Buscar clientes", subtitle: "Abrir en el backoffice" },
      { command: "buscar-proyectos", icon: Icon.Folder, title: "Buscar proyectos", subtitle: "Tareas y estado" },
      {
        command: "facturas",
        icon: Icon.Receipt,
        title: "Facturas",
        subtitle: "Pendientes, vencidas, pagadas, borradores",
      },
      { command: "propuestas", icon: Icon.Document, title: "Propuestas", subtitle: "Abiertas, borradores, aceptadas" },
      { command: "gastos", icon: Icon.CreditCard, title: "Gastos", subtitle: "Por proveedor y estado" },
      {
        command: "buscar-documentos",
        icon: Icon.Document,
        title: "Buscar documentos",
        subtitle: "Documentos internos",
      },
    ],
  },
  {
    title: "Crear",
    entries: [
      { command: "crear-lead", icon: Icon.AddPerson, title: "Nuevo lead", subtitle: "Formulario mínimo" },
      { command: "crear-tarea", icon: Icon.PlusCircle, title: "Nueva tarea", subtitle: "En un proyecto" },
      { command: "registrar-horas", icon: Icon.Stopwatch, title: "Registrar horas", subtitle: "En un proyecto" },
    ],
  },
  {
    title: "Empresa",
    entries: [
      { command: "nif", icon: Icon.BankNote, title: "Copiar NIF", subtitle: COMPANY.nif },
      {
        command: "enlaces",
        icon: Icon.Link,
        title: "Enlaces y datos de empresa",
        subtitle: "Backoffice, landing, redes, contacto",
      },
      {
        command: "datos-empresa",
        icon: Icon.Clipboard,
        title: "Datos de la empresa (MCP)",
        subtitle: "Razón social, NIF y dirección desde el backoffice",
      },
    ],
  },
  {
    title: "Avanzado",
    entries: [
      {
        command: "explorar-mcp",
        icon: Icon.WrenchScrewdriver,
        title: "Todas las herramientas MCP",
        subtitle: "Explora y ejecuta cualquier herramienta",
      },
    ],
  },
];

export default function Command() {
  return (
    <List navigationTitle="Doscientos" searchBarPlaceholder="¿Qué necesitas hacer?">
      {sections.map((section) => (
        <List.Section key={section.title} title={section.title}>
          {section.entries.map((entry) => (
            <List.Item
              key={entry.command}
              icon={entry.icon}
              title={entry.title}
              subtitle={entry.subtitle}
              actions={
                <ActionPanel>
                  <Action
                    title="Abrir"
                    icon={entry.icon}
                    onAction={() => void launchCommand({ name: entry.command, type: LaunchType.UserInitiated })}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
      <List.Section title="Configuración">
        <List.Item
          icon={Icon.WrenchScrewdriver}
          title="Conectar con el MCP"
          subtitle="Configura la carpeta del servidor y Node.js"
          actions={
            <ActionPanel>
              <Action title="Abrir Preferencias" onAction={() => void openExtensionPreferences()} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
