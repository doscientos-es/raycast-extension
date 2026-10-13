/**
 * Datos fijos de Doscientos. Edita aquí si algo cambia: el resto de la extensión los lee de este archivo.
 */

export const COMPANY = {
  name: "DOSCIENTOS DESARROLLO TECNOLOGICO, S.L.",
  tradeName: "doscientos",
  nif: "B88873393",
  street: "Carrer Can Pou, 12",
  zip: "08330",
  city: "Premià de Mar",
  province: "Barcelona",
  country: "ES",
  email: "hola@doscientos.es",
  phone: "+34 671 17 15 25",
} as const;

export const COMPANY_ADDRESS = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city} (${COMPANY.province}), ${COMPANY.country}`;

export const COMPANY_BILLING = [COMPANY.name, COMPANY.nif, COMPANY_ADDRESS].join("\n");

export const BACKOFFICE_URL = "https://app.doscientos.es";
export const LANDING_URL = "https://doscientos.es";

export type QuickLink = { title: string; url: string; section: "Backoffice" | "Landing" | "Redes" };

export const QUICK_LINKS: QuickLink[] = [
  { section: "Backoffice", title: "Inicio", url: `${BACKOFFICE_URL}/inicio` },
  { section: "Backoffice", title: "Leads", url: `${BACKOFFICE_URL}/leads` },
  { section: "Backoffice", title: "Clientes", url: `${BACKOFFICE_URL}/clients` },
  { section: "Backoffice", title: "Proyectos", url: `${BACKOFFICE_URL}/projects` },
  { section: "Backoffice", title: "Facturas", url: `${BACKOFFICE_URL}/invoices` },
  { section: "Backoffice", title: "Documentos", url: `${BACKOFFICE_URL}/documents` },
  { section: "Backoffice", title: "Ajustes", url: `${BACKOFFICE_URL}/settings` },
  { section: "Landing", title: "Web de Doscientos", url: LANDING_URL },
  { section: "Landing", title: "Proyectos", url: `${LANDING_URL}/projects` },
  { section: "Landing", title: "Packs de webs", url: `${LANDING_URL}/packs` },
  { section: "Landing", title: "Blog", url: `${LANDING_URL}/blog` },
  { section: "Landing", title: "Sobre nosotros", url: `${LANDING_URL}/sobre-nosotros` },
  { section: "Landing", title: "Código abierto", url: `${LANDING_URL}/open-source` },
  { section: "Landing", title: "Novedades", url: `${LANDING_URL}/changelog` },
  { section: "Landing", title: "Contacto", url: `${LANDING_URL}/contact` },
  { section: "Landing", title: "Aviso legal", url: `${LANDING_URL}/legal` },
  { section: "Redes", title: "LinkedIn", url: "https://www.linkedin.com/company/doscientos" },
  { section: "Redes", title: "GitHub", url: "https://github.com/doscientos" },
  { section: "Redes", title: "Instagram", url: "https://instagram.com/doscientos.es" },
];
