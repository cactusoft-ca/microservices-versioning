import { inc, ReleaseType } from 'semver';
import { GitService } from './git-service';
import { ServicePaths } from "./service-paths";
import { debug, warning, error as actionError } from '@actions/core'
import { context } from "@actions/github"
import { VersionFileType } from './enums';

export class ServiceSemVer {
  public name: string;
  public releaseType: ReleaseType;
  public paths: ServicePaths | null;
  public currentVersion: string | undefined;
  public gitService: GitService;
  public tagged: boolean = false;
  public released: boolean = false;
  public modifedFiles = new Array<{type: VersionFileType, path: string}>()

  constructor(
    name: string,
    releaseType: ReleaseType,
    paths: ServicePaths | null,
    gitService: GitService
  ) {
    debug(`Context repo owner from GitService: ${context.repo.owner}`)

    this.name = name;
    this.releaseType = releaseType;
    this.paths = paths;
    this.gitService = gitService;
  }

  public getNextVersionTag(): string {
    if (this.currentVersion === undefined) {
      throw new Error('FATAL: Cannot provite a next version since current version is null')
    }

    return `${this.name}/v${this.getBumpedVersion()}`;
  }

  public getBumpedVersion() {

    if (this.currentVersion === undefined) {
      throw new Error('FATAL: Cannot provite a next version since current version is null')
    }

    return inc(this.currentVersion, this.releaseType);
  }

  public getNextVersionMessage(): string {
    if (this.currentVersion === undefined) {
      throw new Error('FATAL: Cannot provite a next version since current version is null')
    }

    return `Auto bump ${this.name} ${this.getNextVersionTag()} ${this.releaseType.toString()}`;
  }

  public async setVersions(currentVersion: string, git: GitService) {
    try {
      this.currentVersion = currentVersion;

      if (this.paths === null || this.paths.versionFiles === null) {
        warning(`No Version files to process for service "${this.name}"`)

        await this.CreateTag(git);
        await this.CreateRelease(git);
        return;
      }

      const versionFiles = this.paths.versionFiles;

      debug(`${versionFiles?.length} Version files to process for service "${this.name}"`)
      debug(`${JSON.stringify(versionFiles, null, 2)}`)

      for (const file of versionFiles) {
        debug(`Processing version file of type: ${file.type}`)

        if (file.fullPath === null) {
          throw new Error(`FATAL: Full path is missing for version file of type: "${file.type}" for service: "${this.name}"`);
        }

        if (file.relativePath === null) {
          throw new Error(`FATAL: Relative path is missing for version file of type: "${file.type}" for service: "${this.name}"`);
        }

        const result = await file.setVersion(this, git);

        if(result !== null){
          this.modifedFiles.push(result);
        }
      }

      const commitRes = await git.commit(this.getNextVersionMessage())
      debug(JSON.stringify(commitRes, null, 2))

      await this.CreateTag(git);
      await this.CreateRelease(git);
    } catch (error) {
      throw new Error(`FATAL: An error occured while setting versions:\n ${error}`)
    }
  }

  private async CreateTag(git: GitService) {
    const tagRes = await git.createAnnotatedTag(this);
    debug(JSON.stringify(tagRes, null, 2));

    const pushRes = await git.pushAll(this);
    debug(JSON.stringify(pushRes, null, 2));

    this.tagged = true;
  }

  private async CreateRelease(git: GitService) {
    const createReleaseRes = await git.createRelease(context.repo.owner, context.repo.repo, this.getNextVersionTag(), "a body", true);
    debug(JSON.stringify(createReleaseRes, null, 2));

    this.tagged = false;
  }
}