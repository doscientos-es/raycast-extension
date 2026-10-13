import { Clipboard, showHUD } from "@raycast/api";
import { COMPANY } from "./constants";

export default async function Command() {
  await Clipboard.copy(COMPANY.nif);
  await showHUD(`NIF copiado: ${COMPANY.nif}`);
}
