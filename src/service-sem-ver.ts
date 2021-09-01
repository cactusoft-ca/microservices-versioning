import { inc, ReleaseType } from 'semver';
import { GitService } from './git-service';
import { ServicePaths } from "./service-paths";
import { debug, warning, error as actionError } from '@actions/core'
import { context } from "@actions/github"

export class ServiceSemVer {
  public name: string;
  public releaseType: ReleaseType;
  public paths: ServicePaths | null;
  public currentVersion: string | undefined;
  public gitService: GitService;

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
      throw new Error('Cannot provite a next version since current version is null')
    }

    return `${this.name}/v${inc(this.currentVersion, this.releaseType)}`;
  }

  public getNextVersionMessage(): string {
    if (this.currentVersion === undefined) {
      throw new Error('Cannot provite a next version since current version is null')
    }

    return `Auto bump ${this.name} ${this.getNextVersionTag()} ${this.releaseType.toString()}`;
  }

  public async setVersions(currentVersion: string, git: GitService) {
    try {
      this.currentVersion = currentVersion;

      if (this.paths === null) {
        return;
      }

      const versionFiles = this.paths.versionFiles;

      if (versionFiles === null) {
        warning(`No Version files to process for service "${this.name}"`)

        await this.TagAndRelease(git);
        return;
      }

      debug(`${versionFiles?.length} Version files to process for service "${this.name}"`)
      debug(`${JSON.stringify(versionFiles)}`)

      for (const file of versionFiles) {
        debug(`Processing version file of type: ${file.type}`)

        if (file.fullPath === null) {
          throw new Error(`Full path is missing for version file of type: "${file.type}" for service: "${this.name}"`);
        }

        if (file.relativePath === null) {
          throw new Error(`Relative path is missing for version file of type: "${file.type}" for service: "${this.name}"`);
        }

        await file.setVersion(this, git)
      }

      const commitRes = await git.commit(this.getNextVersionMessage())
      debug(JSON.stringify(commitRes))

      await this.TagAndRelease(git);
    } catch (error) {
      actionError(error)
      throw new Error(`An error occured while setting versions:\n ${error}`)
    }
  }

  private async TagAndRelease(git: GitService) {
    const tagRes = await git.createAnnotatedTag(this);
    debug(JSON.stringify(tagRes));

    const pushRes = await git.pushAll(this);
    debug(JSON.stringify(pushRes));

    const createReleaseRes = await git.createRelease(context.repo.owner, context.repo.repo, this.getNextVersionTag(), "a body", true);
    debug(JSON.stringify(createReleaseRes));
  }
}