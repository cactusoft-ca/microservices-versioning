import { setFailed, getInput, getMultilineInput, debug, error as actionError, setOutput, warning, error } from '@actions/core'
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
import { stringify } from 'querystring';

async function run(): Promise<void> {
  try {
    const pull_number: string = getInput('pull_number');
    const owner: string = getInput('owner');
    const repo: string = getInput('repo');
    const token: string = getInput('token');
    const workingDirectory = getInput('working_directory', { required: true });
    const servicesPath = getInput('services_path');
    const servicePath = getInput('service_path');

    const customServicesPaths = getMultilineInput('custom_services_path').map(function (x: string): ServicePaths {
      return new ServicePaths(x.split(',')[0], x.split(',')[1]);
    });
    const serviceName = getInput('service_name');
    const releaseType = getInput('release_type');
    const git = new GitService(workingDirectory, token);
    const uniqueService = serviceName !== "";

    debug(`customServicesPaths:\n ${JSON.stringify(customServicesPaths, null ,2)}`);
    debug(`Context repo owner: ${context.repo.owner}`);
    debug(`Checking labels for pull request number ${pull_number}`);

    const octokit = getOctokit(token)

    let bumpLabels: string[]
    const versionPriorities = ['major', 'minor', 'patch'];

    if (uniqueService) {
      if (releaseType === "") {
        throw new Error(`A release type must be provided in order to bump service: "${serviceName}"`)
      }

      if (servicePath === "") {
        throw new Error(`A service path must be provided in order to bump service: "${serviceName}"`)
      }

      if (!versionPriorities.includes(releaseType)) {
        throw new Error(`A release type must be either Major, Minor or Patch`)
      }

      bumpLabels = [`${serviceName}:${releaseType}`]
    } else {

      const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner,
        repo,
        pull_number: Number(pull_number)
      })

      const tags: string[] = pull.data.labels.map(a => a == null ? '' : a.name as string);
      bumpLabels = tags.filter(x => versionPriorities.some(x.includes.bind(x)));
    }

    debug(`Versioning Labels ${JSON.stringify(bumpLabels, null, 2)}`);

    let errors = new Array<{ service: string, error: string }>()

    let versionsByService: ServiceSemVer[] = from(bumpLabels).groupBy(function (x) { return x.split(':')[0]; })
      .select(function (x) {
        let servicePaths: ServicePaths | null = null;

        try {
          servicePaths = setServicePaths(x.key, workingDirectory, servicesPath, customServicesPaths, uniqueService, servicePath);
        } catch (error) {
          debug(`SetServicePaths ERROR: ${error}`)
          debug(`setServicePaths Service: ${x.key} push errors: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
          errors.push({ service: x.key, error: error.message });
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

    const unexistantServices = errors.filter(x => x.error.includes('An expected service root folder is missing')).map(x => x.service);
    debug(`List of unexistant services:\n ${JSON.stringify(unexistantServices, null, 2)}`)

    versionsByService = versionsByService.filter(svc => !unexistantServices.includes(svc.name));

    if (versionsByService.length === 0) {
      debug('No service to bump');
      setOutputsAndAnnotations(errors, versionsByService);
      return
    }

    for (const service of versionsByService) {
      try {
        const currentVersion = await git.getLatestTagByServiceName(service.name, owner, repo);
        await service.setVersions(currentVersion, git);
      } catch (error) {
        debug(`setVersions Service: ${service.name} push errors: ${JSON.stringify(error, null, 2)}`)
        errors.push({ service: service.name, error: error.message });
      }
    }

    setOutputsAndAnnotations(errors, versionsByService);

  } catch (error) {
    setFailed(error.message)
  }
}

run()


function setOutputsAndAnnotations(errors: { service: string; error: string; }[], versionsByService: ServiceSemVer[]) {
  const allFailed = [...new Set(errors.map(x => x.service))].length === versionsByService.length;

  if (allFailed) {
    throw new Error(JSON.stringify(errors, null, 2));
  }

  if (errors.length > 0) {
    for (const error of errors) {
      if (error.error.includes('An expected service root folder is missing')) {
        warning(`Service not BUMPED: "${error.service}".\n ${error.error}`)
      } else {
        warning(`Service bump warning:: "${error.service}".\n ${error.error}`);
      }
    }
  }

  let results = new Array<{
    service: string,
    releaseType: ReleaseType,
    oldVersion: string | undefined,
    newVersion: string | null,
    modifiedFiles: { type: VersionFileType, path: string }[],
    tagged: boolean,
    released: boolean
  }>()

  for (const svc of versionsByService) {
    results.push({
      service: svc.name,
      releaseType: svc.releaseType,
      oldVersion: svc.currentVersion,
      newVersion: svc.getBumpedVersion(),
      modifiedFiles: svc.modifedFiles,
      tagged: svc.tagged,
      released: svc.released
    })
  }

  setOutput('results', JSON.stringify(results, null, 2))
}

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
    } else {
      throw err;
    }

  }
}

function setServicePaths(name: string, workingDirectory: string, servicesPath: string, customServicePaths: ServicePaths[], uniqueService: boolean, uniqueServicePath: string) {
  debug(`Setting service path for ${name}`)

  const servicePaths = new ServicePaths()
  const customeServiceNames = customServicePaths.map(function (x: ServicePaths) { return x.name; })
  const customServicePathIndex = customeServiceNames.indexOf(name)

  let serviceRootPath
  if (customServicePathIndex === -1) {
    if (uniqueService) {
      serviceRootPath = join(workingDirectory, uniqueServicePath)
    } else {
      serviceRootPath = join(workingDirectory, servicesPath, name)
    }
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