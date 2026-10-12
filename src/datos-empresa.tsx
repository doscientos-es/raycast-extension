import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { BACKOFFICE_URL } from "./mcp";
import { ErrorEmpty, formatDate, useMcpRead } from "./use-mcp";

type CompanySettings = {
  company_name?: string | null;
  company_nif?: string | null;
  company_address_street?: string | null;
  company_address_zip?: string | null;
  company_address_city?: string | null;
  company_address_province?: string | null;
  company_address_country?: string | null;
  default_vat_rate?: number | string | null;
  invoice_series?: string | null;
  invoice_next_number?: number | string | null;
  updated_at?: string | null;
  message?: string;
};

type Row = { title: string; value: string; icon: Icon };

const text = (value: unknown) => (value === undefined || value === null ? "" : String(value).trim());

function buildRows(data: CompanySettings): Row[] {
  const city = [text(data.company_address_zip), text(data.company_address_city)].filter(Boolean).join(" ");
  const locality = [city, text(data.company_address_province) && `(${text(data.company_address_province)})`]
    .filter(Boolean)
    .join(" ");
  const fullAddress = [text(data.company_address_street), locality, text(data.company_address_country)]
    .filter(Boolean)
    .join(", ");
  const nextNumber = text(data.invoice_next_number);
  const rows: Row[] = [
    { title: "Razón social", value: text(data.company_name), icon: Icon.Building },
    { title: "NIF", value: text(data.company_nif), icon: Icon.BankNote },
    { title: "Dirección completa", value: fullAddress, icon: Icon.Pin },
    { title: "Calle", value: text(data.company_address_street), icon: Icon.House },
    { title: "Código postal", value: text(data.company_address_zip), icon: Icon.Envelope },
    { title: "Ciudad", value: text(data.company_address_city), icon: Icon.Map },
    { title: "Provincia", value: text(data.company_address_province), icon: Icon.Map },
    { title: "País", value: text(data.company_address_country), icon: Icon.Globe },
    { title: "IVA por defecto (%)", value: text(data.default_vat_rate), icon: Icon.Coins },
    { title: "Serie de facturas", value: text(data.invoice_series), icon: Icon.Receipt },
    {
      title: "Próxima factura",
      value: [text(data.invoice_series), nextNumber].filter(Boolean).join("-"),
      icon: Icon.Hashtag,
    },
  ];
  return rows.filter((row) => row.value);
}

export default function Command() {
  const { data, isLoading, error, revalidate } = useMcpRead<CompanySettings>("get_company_settings");
  const rows = data ? buildRows(data) : [];
  const allText = rows.map((row) => `${row.title}: ${row.value}`).join("\n");
  const billing = ["Razón social", "NIF", "Dirección completa"]
    .map((title) => rows.find((row) => row.title === title)?.value)
    .filter(Boolean)
    .join("\n");

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filtrar datos de la empresa…">
      {error ? <ErrorEmpty title="No se pudieron cargar los datos" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && rows.length === 0 ? (
        <List.EmptyView title="Sin datos de empresa" description={data?.message ?? "Completa los ajustes en Doscientos."} />
      ) : null}
      {rows.length > 0 ? (
        <List.Section title="Acciones de grupo">
          <List.Item
            icon={Icon.Clipboard}
            title="Datos de facturación"
            subtitle="Razón social, NIF y dirección"
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copiar Datos De Facturación" content={billing} />
                <Action.CopyToClipboard title="Copiar Todo" content={allText} />
              </ActionPanel>
            }
          />
        </List.Section>
      ) : null}
      <List.Section title="Datos fiscales">
        {rows.map((row) => (
          <List.Item
            key={row.title}
            icon={row.icon}
            title={row.title}
            subtitle={row.value}
            keywords={[row.value]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title={`Copiar ${row.title}`} content={row.value} />
                <Action.CopyToClipboard title="Copiar Datos De Facturación" content={billing} />
                <Action.CopyToClipboard title="Copiar Todo" content={allText} />
                <Action.OpenInBrowser title="Abrir Ajustes En Doscientos" url={`${BACKOFFICE_URL}/settings`} />
                <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
              </ActionPanel>
            }
            accessories={data?.updated_at ? [{ text: `Act. ${formatDate(data.updated_at)}` }] : []}
          />
        ))}
      </List.Section>
    </List>
  );
}
