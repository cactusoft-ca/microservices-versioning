import { VersionFiles } from "./version-files";


export class ServicePaths {
  name: string | null;
  path: string | null;
  versionFiles: VersionFiles[] | null;

  constructor(name: string | null = null, path: string | null = null, versionFiles: VersionFiles[] | null = null) {
    this.name = name;
    this.path = path;
    this.versionFiles = versionFiles;
  }
}
