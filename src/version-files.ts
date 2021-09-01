import { GitService } from "./git-service";
import { ServiceSemVer } from "./service-sem-ver";
import { parseStringPromise, Builder } from 'xml2js';
import { readFileSync, writeFileSync } from 'fs';
import { load, dump } from 'js-yaml';
import { debug, warning } from '@actions/core'
import { VersionFileType } from "./enums";

export class VersionFiles {

  type: VersionFileType;
  fullPath: string;
  relativePath: string;

  constructor(type: VersionFileType, fullPath: string, relativePath: string) {
    this.type = type;
    this.fullPath = fullPath;
    this.relativePath = relativePath;
  }

  public async setVersion(service: ServiceSemVer, gitClient: GitService) {
    debug(`Setting version in file of type: ${this.type} located at: ${this.fullPath} for service: ${service.name}`)

    switch (this.type) {
      case VersionFileType.DotNetCore:
        await this.setDotNetCoreBuildPropVersion(service, gitClient)
        break;
      case VersionFileType.Helm:
        await this.setHelmChartAppVersion(service, gitClient)
        break;
      default:
        warning(`No method found to modify version in file of type: ${this.type} located at: ${this.fullPath} for service: ${service.name}`)
        break;
    }
  }

  private async setDotNetCoreBuildPropVersion(service: ServiceSemVer, gitClient: GitService) {
    try {
      const data = readFileSync(this.fullPath, { encoding: "utf8" })
      const result = await parseStringPromise(data);
      const nextVersion = service.getNextVersionTag();

      result.Project.PropertyGroup[0].Version = nextVersion;

      const builder = new Builder({ headless: true });
      const xml = builder.buildObject(result);

      writeFileSync(this.fullPath, xml)

      debug(`Service "${service.name}": Updated .Net Core BuildPropVersion to ${nextVersion}. Path: ${this.fullPath}.\n New Content:\n ${xml}`);

      await gitClient.addFile(this.relativePath)

    } catch (err) {
      throw new Error(`An error occured trying to update helm chart for service ${service.name} - err: ${err}`);
    }
  }

  private async setHelmChartAppVersion(service: ServiceSemVer, gitClient: GitService) {
    try {
      const file = readFileSync(this.fullPath, { encoding: "utf8" })
      const doc = load(file) as { appVersion?: string };
      const nextVersion = service.getNextVersionTag();
      doc.appVersion = nextVersion;

      writeFileSync(this.fullPath, dump(doc));

      debug(`Service ${service.name}: Updated Helm Chart appVersion to ${nextVersion}. Path: ${this.fullPath}.\n New Content:\n ${JSON.stringify(load(file), null, 2)}`);

      await gitClient.addFile(this.relativePath)

    } catch (err) {
      throw new Error(`An error occured trying to update helm chart for service ${service.name} - err: ${err}`);
    }
  }
}