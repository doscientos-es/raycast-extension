import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useState } from "react";
import { BACKOFFICE_URL, Page } from "./mcp";
import { ErrorEmpty, formatDate, formatMoney, useMcpRead } from "./use-mcp";

type Expense = {
  id: string;
  vendor?: string;
  description?: string;
  category?: string;
  status?: string;
  expense_date?: string;
  total?: number | string;
  invoice_reference?: string | null;
  projects?: { name?: string } | null;
};

const filters = [
  { value: "pending", title: "Pendientes" },
  { value: "paid", title: "Pagados" },
  { value: "cancelled", title: "Cancelados" },
  { value: "all", title: "Todos" },
];

const statusColor: Record<string, Color> = {
  pending: Color.Orange,
  paid: Color.Green,
  cancelled: Color.SecondaryText,
};

export default function Command() {
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const { data, isLoading, error, revalidate } = useMcpRead<Page<Expense>>("search_expenses", {
    vendor: query.trim() || undefined,
    status: filter === "all" ? undefined : filter,
    limit: 50,
  });
  // search_expenses returns { items } or a bare list depending on version; accept both.
  const items = Array.isArray(data) ? (data as Expense[]) : (data?.items ?? []);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      throttle
      filtering={false}
      searchBarPlaceholder="Buscar gasto por proveedor…"
      searchBarAccessory={
        <List.Dropdown tooltip="Filtrar gastos" value={filter} onChange={setFilter}>
          {filters.map((item) => (
            <List.Dropdown.Item key={item.value} value={item.value} title={item.title} />
          ))}
        </List.Dropdown>
      }
    >
      {error ? <ErrorEmpty title="No se pudieron cargar los gastos" error={error} onRetry={revalidate} /> : null}
      {!error && !isLoading && items.length === 0 ? <List.EmptyView title="No hay gastos con este filtro" /> : null}
      {items.map((expense) => (
        <List.Item
          key={expense.id}
          icon={{ source: Icon.CreditCard, tintColor: statusColor[expense.status ?? ""] }}
          title={expense.vendor || "Sin proveedor"}
          subtitle={expense.description}
          keywords={[expense.description ?? "", expense.invoice_reference ?? ""]}
          accessories={[
            ...(expense.category ? [{ tag: expense.category }] : []),
            ...(expense.status ? [{ tag: { value: expense.status, color: statusColor[expense.status] } }] : []),
            { text: formatMoney(expense.total) },
            ...(expense.expense_date ? [{ text: formatDate(expense.expense_date) }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Abrir Gastos En Doscientos" url={`${BACKOFFICE_URL}/expenses`} />
              {expense.invoice_reference ? (
                <Action.CopyToClipboard title="Copiar Referencia De Factura" content={expense.invoice_reference} />
              ) : null}
              <Action.CopyToClipboard title="Copiar Importe" content={String(expense.total ?? "")} />
              <Action title="Actualizar" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
