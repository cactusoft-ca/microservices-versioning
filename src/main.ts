import { setFailed, getInput, debug, setOutput, warning } from '@actions/core'
import { getOctokit, context } from "@actions/github"
import { from } from "linq-to-typescript"
import { inc, ReleaseType } from 'semver';
import { join } from 'path'
import { readFile, writeFile } from 'fs'

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
    const pull_number: string = getInput('pull_number')
    const owner: string = getInput('owner')
    const repo: string = getInput('repo')
    const token: string = getInput('token')
    debug(`Context:\n ${context}`)

    debug(`Context repo owner: ${context.repo.owner}`)
    debug(`Checking labels for pull request number ${pull_number}`)
    const octokit = getOctokit(token)
    const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number)
    })

    const tags: string[] = pull.data.labels.map(a => a == null ? '' : a.name as string)
    const version_priority = ['major', 'minor', 'patch']
    const versioning_labels = tags.filter(x => version_priority.some(x.includes.bind(x)))

    debug(`Versioning Labels ${JSON.stringify(versioning_labels)}`)

    const versions_by_service: ServiceSemVer[] = from(versioning_labels).groupBy(function (x) { return x.split(':')[0]; })
      .select(function (x) {
        return {
          name: x.key,
          release_type: JSON.stringify(x.select(x => x.split(':')[1]).toArray().sort(function (a, b) {
            const aKey = version_priority.indexOf(a)
            const bKey = version_priority.indexOf(b);
            return aKey - bKey;
          })[0]).replace(/['"]+/g, '') as ReleaseType,
          current_version: null,
          next_version: null
        };
      }).toArray();

    if (versions_by_service.length === 0) {
      debug('No service to bump')
      return
    }

    let itemsProcessed: number = 0
    versions_by_service.forEach(function (service) {
      debug(`Getting current version for ${service.name}`)
      getLatestVersion(octokit, service.name, owner, repo, token)
        .then((latest_version: string) => {
          service.current_version = latest_version
          service.next_version = bump(latest_version, service.release_type)
          debug(`Bumped service ${service.name} version from ${latest_version} to ${service.next_version}`)

          editVersionFiles(service)

          itemsProcessed++
          if (itemsProcessed === versions_by_service.length) {
            setOutput('versions_by_service', versions_by_service)
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
  var path = require('path');
  const filesTypesAndPathsToBumpPath = join(getInput('services_path'),service.name )

}

function setDotNetCoreBuildPropVersion(path: string, version: string) {
  const xml2js = require('xml2js')

  readFile(path, "utf-8", (err: any, data: any) => {
    if (err) {
      throw err;
    }

    // convert XML data to JSON object
    xml2js.parseString(data, (err: any, result: { Project: { PropertyGroup: { Version: string; }[]; }; }) => {
      if (err) {
        throw err;
      }

      result.Project.PropertyGroup[0].Version = version;

      // convert JSON objec to XML
      const builder = new xml2js.Builder({ headless: true });
      const xml = builder.buildObject(result);

      // write updated XML string to a file
      writeFile(path, xml, { encoding: 'utf8', flag: 'w' }, (err: any) => {
        if (err) {
          throw err;
        }

        debug(`Updated .Net Core BuildPropVersion. Path: ${path} with ${xml}`);
      });

    });
  });
}

function setHelmChartAppVersion(path: string, version: string) {
  const YAML = require('js-yaml')

  var file = readFile(path, "utf-8", (err: any, data: any) => {
    if (err) {
      warning(err);
      throw err;
    }
    const doc = YAML.load(file);

    doc.appVersion = version;
    const dump = YAML.dump(doc)

    writeFile(path, dump, 'utf8', (err: any) => {
      if (err) {
        warning(err);
        throw err
      }
    });
  });
}

interface ServiceSemVer {
  name: string;
  release_type: ReleaseType;
  current_version: string | null;
  next_version: string | null;
}
