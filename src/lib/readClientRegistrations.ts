import { readFile, readdir } from "fs/promises";
import { ClientRegistration } from "./types";
import path from "node:path";

export async function readClientRegistrations(clientConfigDir:string): Promise<Array<ClientRegistration>> {
  const registrations: Array<ClientRegistration> = [];
  const dirents = await readdir(clientConfigDir, { withFileTypes: true});
  const jsonFilePaths = dirents.filter(d => d.isFile() && d.name.endsWith(".json"))
  .map(d => path.join(clientConfigDir, d.name));
  for (const jsonFilePath of jsonFilePaths) {
    const fileJson = await readFile(jsonFilePath, { encoding: "utf8"});
    const registration = JSON.parse(fileJson);
    registrations.push(registration);
  }
  return registrations;
}