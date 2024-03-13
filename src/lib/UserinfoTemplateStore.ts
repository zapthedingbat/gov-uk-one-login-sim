import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { UserinfoTemplate } from "./types";

export interface IUserinfoTemplateStore {
  getIds(): Promise<Array<string>>;
  get(id: string): Promise<UserinfoTemplate>;
}

export class UserinfoTemplateStore implements IUserinfoTemplateStore {
  private configDirectory: string;

  constructor(configDirectory: string) {
    this.configDirectory = configDirectory;
  }

  async getIds(): Promise<string[]> {
    const dirents = await readdir(this.configDirectory, { withFileTypes: true});
    return dirents.filter(d => d.isFile() && d.name.endsWith(".json"))
    .map(d => d.name);
  }

  async get(id: string): Promise<UserinfoTemplate> {
    const jsonFilePath = path.join(this.configDirectory, id.replace(/\/+/g, ""));
    const fileJson = await readFile(jsonFilePath, { encoding: "utf8"});
    return JSON.parse(fileJson);
  }
}
