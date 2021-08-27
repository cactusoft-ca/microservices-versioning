import { setFailed, getInput, getMultilineInput, debug, setOutput, warning, error as actionError } from '@actions/core'
import { getOctokit, context } from "@actions/github"
import { from } from "linq-to-typescript"
import { inc, ReleaseType } from 'semver';
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { version } from 'prettier';
const YAML = require('js-yaml')
const path = require('path');
const xml2js = require('xml2js')

async function getLatestVersion(octo: any, service: string, owner: string, repo: string, token: string) {
  const { repository } = await octo.graphql(`
  {
    repository(owner: "${owner}", name: "${repo}") {
      refs(refPrefix: "refs/tags/", query: "${service}", orderBy: {field: TAG_COMMIT_DATE, direction: ASC}, last: 1) {
        edges {
          node {
            name
          }
        }
      }
    }
  }
`);

  const result = repository.refs.edges[0].node.name.replace(`${service}/v`, '');
  debug(`Latest tag for service ${service}: ${result}`)

  return result as string
}

function bump(version: string, release_type: ReleaseType) {
  return inc(version, release_type)
}

async function run(): Promise<void> {
  try {
    const pull_number: string = getInput('pull_number', { required: true })
    const owner: string = getInput('owner', { required: true })
    const repo: string = getInput('repo', { required: true })
    const token: string = getInput('token', { required: true })
    const workingDirectory = getInput('working_directory', { required: true })
    const servicesPath = getInput('services_path')
    const customServicesPaths = getMultilineInput('custom_services_path').map(function (x: string): ServicePaths {
      return {
        name: x.split(',')[0],
        path: x.split(':')[1],
        versionFiles: new Array<VersionFiles>()
      }
    })

    debug(`Context:\n ${JSON.stringify(context)}`)

    debug(`Context repo owner: ${context.repo.owner}`)
    debug(`Checking labels for pull request number ${pull_number}`)
    const octokit = getOctokit(token)
    const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number)
    })

    const tags: string[] = pull.data.labels.map(a => a == null ? '' : a.name as string)
    const versionPriorities = ['major', 'minor', 'patch']
    const bumpLabels = tags.filter(x => versionPriorities.some(x.includes.bind(x)))

    debug(`Versioning Labels ${JSON.stringify(bumpLabels)}`)

    const versionsByService: ServiceSemVer[] = from(bumpLabels).groupBy(function (x) { return x.split(':')[0]; })
      .select(function (x) {
        return {
          name: x.key,
          releaseType: JSON.stringify(x.select(x => x.split(':')[1]).toArray().sort(function (a, b) {
            const aKey = versionPriorities.indexOf(a)
            const bKey = versionPriorities.indexOf(b);
            return aKey - bKey;
          })[0]).replace(/['"]+/g, '') as ReleaseType,
          currentVersion: null,
          nextVersion: null,
          paths: setServicePath(x.key, workingDirectory, servicesPath, customServicesPaths)
        };
      }).toArray();

    if (versionsByService.length === 0) {
      debug('No service to bump')
      return
    }

    let itemsProcessed: number = 0
    versionsByService.forEach(function (service) {
      debug(`Getting current version for ${service.name}`)
      getLatestVersion(octokit, service.name, owner, repo, token)
        .then((latest_version: string) => {
          service.currentVersion = latest_version
          service.nextVersion = bump(latest_version, service.releaseType)
          debug(`Bumped service ${service.name} version from ${latest_version} to ${service.nextVersion}`)

          editVersionFiles(service)

          itemsProcessed++
          if (itemsProcessed === versionsByService.length) {
            setOutput('versions_by_service', versionsByService)
          }
        }).catch((error: any) => {
          debug(error);
        })
    });
  } catch (error) {
    setFailed(error.message)
  }
}

run()

function editVersionFiles(service: ServiceSemVer) {
  const filesTypesAndPathsToBumpPath = join(getInput('services_path'), service.name)

}

function setDotNetCoreBuildPropVersion(path: string, version: string, serviceName: string) {
  try {
    const data = readFileSync(path, { encoding: "utf8" })

    // convert XML data to JSON object
    xml2js.parseString(data, (err: any, result: { Project: { PropertyGroup: { Version: string; }[]; }; }) => {
      if (err) {
        throw err;
      }

      result.Project.PropertyGroup[0].Version = version;

      const builder = new xml2js.Builder({ headless: true });
      const xml = builder.buildObject(result);

      writeFileSync(path, xml)

      debug(`Service ${serviceName}: Updated .Net Core BuildPropVersion. Path: ${path} with ${xml}`);
    });
  } catch (error) {
    actionError(`An error occured trying to update helm chart for service ${serviceName}`);
  }
}

function setHelmChartAppVersion(path: string, version: string, serviceName: string) {
  try {
    const file = readFileSync(path, { encoding: "utf8" })
    let doc = YAML.load(file);

    doc.appVersion = version;

    writeFileSync(path, YAML.dump(doc));
    debug(`Service ${serviceName}: Updated Helm Chart appVersion to ${version}. Path: ${path}`);

  } catch (err) {
    actionError(`An error occured trying to update helm chart for service ${serviceName}`);
  }
}

function getVersionFilesTypesAndPaths(serviceName: string, metadataFilePath: string) {
  let versionFiles: VersionFiles[] = new Array<VersionFiles>()

  try {
    const doc = YAML.load(readFileSync(metadataFilePath, { encoding: "utf8" }))

    doc.versionFiles.forEach((element: { type: any; path: any; }) => {
      debug(`Versioning metadata for ${serviceName}: ${element.type} : ${element.path}`)
      versionFiles.push(new VersionFiles(element.type, element.path))
    });
    return versionFiles

  } catch (err: any) {

    if (err) {
      if (err && err.code == 'ENOENT') {
        warning(`Versioning file metadata not found for ${serviceName}.
        Searched Path: ${metadataFilePath}, the service will be released without any version files changed \n ${err}`)
      }
    }

    return null;
  }
}

function setServicePath(name: string, workingDirectory: string, servicePath: string, customServicePaths: ServicePaths[]) {
  debug(`Setting service path for ${name}`)

  let servicePaths: ServicePaths = new ServicePaths()
  let customServicePathIndex = customServicePaths.map(function (x: ServicePaths) { return x.name; }).indexOf(name)
  let serviceRootPath
  if (customServicePathIndex === -1) {
    serviceRootPath = path.join(workingDirectory, servicePath, name)
  } else {
    serviceRootPath = path.join(workingDirectory, customServicePaths[customServicePathIndex].path, name)
  }

  if (!existsSync(serviceRootPath)) {
    actionError(`An expected service root folder is missing. Service name: ${name}, Path: ${serviceRootPath}`);
  }

  servicePaths.path = serviceRootPath;

  debug(`Root folder for service ${name} has been set to ${serviceRootPath}`)

  servicePaths.versionFiles = getVersionFilesTypesAndPaths(name, join(serviceRootPath, 'versioning.yaml'))

  return servicePaths;
}

interface ServiceSemVer {
  name: string;
  releaseType: ReleaseType;
  currentVersion: string | null;
  nextVersion: string | null;
  paths: ServicePaths;
}

export class VersionFiles {
  type: string | null;
  path: string | null;

  constructor(type: string | null = null, path: string | null = null) {
    this.type = type;
    this.path = path;
  }
}

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
