import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { COMPANY, COMPANY_ADDRESS, COMPANY_BILLING, QUICK_LINKS, QuickLink } from "./constants";

const sectionIcon: Record<QuickLink["section"], Icon> = {
  Backoffice: Icon.AppWindow,
  Landing: Icon.Globe,
  Redes: Icon.Link,
};

const data = [
  { title: "NIF", value: COMPANY.nif, icon: Icon.BankNote },
  { title: "Razón social", value: COMPANY.name, icon: Icon.Building },
  { title: "Dirección fiscal", value: COMPANY_ADDRESS, icon: Icon.Pin },
  { title: "Email", value: COMPANY.email, icon: Icon.Envelope },
  { title: "Teléfono", value: COMPANY.phone, icon: Icon.Phone },
  { title: "Datos de facturación", value: COMPANY_BILLING, icon: Icon.Clipboard },
];

export default function Command() {
  return (
    <List searchBarPlaceholder="Buscar enlace o dato…">
      <List.Section title="Datos de empresa (copiar)">
        {data.map((row) => (
          <List.Item
            key={row.title}
            icon={row.icon}
            title={row.title}
            subtitle={row.value.replace(/\n/g, " · ")}
            keywords={[row.value]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title={`Copiar ${row.title}`} content={row.value} />
                <Action.Paste title={`Pegar ${row.title}`} content={row.value} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {(["Backoffice", "Landing", "Redes"] as const).map((section) => (
        <List.Section key={section} title={section}>
          {QUICK_LINKS.filter((link) => link.section === section).map((link) => (
            <List.Item
              key={link.url}
              icon={sectionIcon[section]}
              title={link.title}
              subtitle={link.url.replace("https://", "")}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={link.url} />
                  <Action.CopyToClipboard title="Copiar Enlace" content={link.url} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
