import { setFailed, getInput, getMultilineInput, debug, setOutput, warning } from '@actions/core'
import { getOctokit, context } from "@actions/github"
import { from } from "linq-to-typescript";
import { ReleaseType } from 'semver';
import { readFileSync, existsSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import { ServicePaths } from "./service-paths";
import { VersionFiles } from "./version-files";
import { ServiceSemVer } from "./service-sem-ver";
import { GitService } from "./git-service";
import { VersionFileType } from './enums';

async function run(): Promise<void> {
  try {
    const pull_number: string = getInput('pull_number', { required: true });
    const owner: string = getInput('owner', { required: true });
    const repo: string = getInput('repo', { required: true });
    const token: string = getInput('token', { required: true });
    const workingDirectory = getInput('working_directory', { required: true });
    const servicesPath = getInput('services_path');
    const customServicesPaths = getMultilineInput('custom_services_path').map(function (x: string): ServicePaths {
      return new ServicePaths(x.split(',')[0], x.split(',')[1]);
    });

    const git = new GitService(workingDirectory, token);

    debug(`customServicesPaths:\n ${JSON.stringify(customServicesPaths)}`);
    debug(`Context repo owner: ${context.repo.owner}`);
    debug(`Checking labels for pull request number ${pull_number}`);

    const octokit = getOctokit(token)
    const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number)
    })

    const tags: string[] = pull.data.labels.map(a => a == null ? '' : a.name as string);
    const versionPriorities = ['major', 'minor', 'patch'];
    const bumpLabels = tags.filter(x => versionPriorities.some(x.includes.bind(x)));

    debug(`Versioning Labels ${JSON.stringify(bumpLabels)}`);

    let errors = new Array<{ service: string, error: string }>()

    const versionsByService: ServiceSemVer[] = from(bumpLabels).groupBy(function (x) { return x.split(':')[0]; })
      .select(function (x) {
        let servicePaths: ServicePaths | null = null;

        try {
          servicePaths = setServicePaths(x.key, workingDirectory, servicesPath, customServicesPaths);
        } catch (error) {
          debug(`setServicePaths Service: ${x.key} push errors: ${JSON.stringify(error)}`)

          errors.push({ service: x.key, error });
        }

        return new ServiceSemVer(
          x.key,
          JSON.stringify(x.select(x => x.split(':')[1]).toArray().sort(function (a, b) {
            const aKey = versionPriorities.indexOf(a)
            const bKey = versionPriorities.indexOf(b);
            return aKey - bKey;
          })[0]).replace(/['"]+/g, '') as ReleaseType,
          servicePaths,
          git);
      }).toArray();

    if (versionsByService.length === 0) {
      debug('No service to bump');
      return
    }

    for (const service of versionsByService) {
      try {
        const currentVersion = await git.getLatestTagByServiceName(service.name, owner, repo);
        await service.setVersions(currentVersion, git);
      } catch (error) {
        debug(`setVersions Service: ${service.name} push errors: ${JSON.stringify(error)}`)
        errors.push({ service: service.name, error });
      }
    }

    const allFailed = [...new Array(errors.map(x => x.service))].length === versionsByService.length;
    debug(`errors: ${JSON.stringify(errors)}`)

    debug(`versionsByService.length: ${versionsByService.length}`)
    debug(`[...new Array(errors.map(x => x.service))].length: ${[...new Array(errors.map(x => x.service))].length}`)
    debug(`allFailed: ${allFailed}`)

    if (allFailed) {
      throw new Error(JSON.stringify(errors))
    }

    if (errors.length > 0) {
      for (const error of errors) {
        warning(`Service: "${error.service}" was not bumped.\n ${error.error} `)
      }
    }

  } catch (error) {
    setFailed(error.message)
  }
}

run()

function getVersionFilesTypesAndPaths(serviceName: string, metadataFilePath: string, workingDirectory: string) {
  const versionFiles: VersionFiles[] = new Array<VersionFiles>()

  try {
    const doc = load(readFileSync(metadataFilePath, { encoding: "utf8" })) as { versionFiles?: { type: string, path: string }[] }

    if (doc.versionFiles === null || doc.versionFiles === undefined) {
      throw new Error();
    }

    for (const vFile of doc.versionFiles) {
      debug(`Versioning metadata for ${serviceName}: ${vFile.type} : ${vFile.path}`)
      versionFiles.push(new VersionFiles(vFile.type as VersionFileType, join(workingDirectory, vFile.path), vFile.path))
    }

    return versionFiles

  } catch (err: any) {

      if (err && err.code == 'ENOENT') {
        throw new Error(`Versioning file metadata not found for ${serviceName}.
        Searched Path: ${metadataFilePath}, the service will be released without any version files changed \n ${err}`)
      }else{
        throw err;
      }

  }
}

function setServicePaths(name: string, workingDirectory: string, servicePath: string, customServicePaths: ServicePaths[]) {
  debug(`Setting service path for ${name}`)

  const servicePaths = new ServicePaths()
  const customeServiceNames = customServicePaths.map(function (x: ServicePaths) { return x.name; })
  const customServicePathIndex = customeServiceNames.indexOf(name)

  let serviceRootPath
  if (customServicePathIndex === -1) {
    serviceRootPath = join(workingDirectory, servicePath, name)
  } else {

    if (customServicePaths[customServicePathIndex].path === null) {
      throw Error(`No custom path was found for service ${name}`)
    }

    serviceRootPath = join(workingDirectory, customServicePaths[customServicePathIndex].path as string)
    debug(`Setting custom path for service ${name} to ${serviceRootPath}`)
  }

  if (!existsSync(serviceRootPath)) {
    throw new Error(`An expected service root folder is missing. Service name: ${name}, Path: ${serviceRootPath}\nMake sure to checkout your repo`);
  }

  servicePaths.path = serviceRootPath;

  debug(`Root folder for service ${name} has been set to ${serviceRootPath}`)

  servicePaths.versionFiles = getVersionFilesTypesAndPaths(name, join(serviceRootPath, 'versioning.yaml'), workingDirectory)

  return servicePaths;
}