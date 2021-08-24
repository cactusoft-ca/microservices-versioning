import { setFailed, getInput, debug, setOutput } from '@actions/core'
import { getOctokit ,context} from "@actions/github"
import { from  } from "linq-to-typescript"
import { graphql } from "@octokit/graphql"

async function getLatestTag(service: string, owner: string, repo: string, token: string) {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  const { repository } = await graphqlWithAuth(`
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

  const result = repository.refs.edges[0].node.name;
  return result as string
}

async function run(): Promise<void> {
  try {
    const pull_number: string = getInput('pull_number')
    const owner: string = getInput('owner')
    const repo: string = getInput('repo')
    const token: string = getInput('token')

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

    const versions_by_service: ServiceBump[] = from(versioning_labels).groupBy(function (x) { return x.split(':')[0]; })
      .select(function (x) {
        return {
          service: x.key,
          bump: JSON.stringify(x.select(x => x.split(':')[1]).toArray().sort(function (a, b) {
            const aKey = version_priority.indexOf(a)
            const bKey = version_priority.indexOf(b);
            return aKey - bKey;
          })[0]),
          latest_version: null
        };
      }).toArray();

      if (versions_by_service.length === 0) {
        debug('No service to bump')
        return
      }

      versions_by_service.forEach(function (service) {
        debug(`Getting actual version for ${service}`)
        getLatestTag(service.service, owner, repo, token)
          .then((latest_tag) => {
            service.latest_version = latest_tag
          }).catch((error) => {
            console.log('Error: ', error);
          })
      });

    debug(JSON.stringify(versions_by_service));

    setOutput('versions_by_service', versions_by_service)
  } catch (error) {
    setFailed(error.message)
  }
}

run()

interface ServiceBump {
  service: string;
  bump: string;
  latest_version: string | null
}
