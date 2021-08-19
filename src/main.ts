import { setFailed, getInput, debug } from '@actions/core'
import { getOctokit ,context} from "@actions/github"
import { from  } from "linq-to-typescript"

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

    debug(`Labels ${JSON.stringify(tags)}`)

    const version_priority = ['major', 'minor', 'patch']

    const versions_by_service =  from(tags)?.groupBy(function(x: string){ return x?.split(':')[0]; })
    .select(function(x){
      return {
        Service: x.key,
        Version: JSON.stringify(x?.select(x => x?.split(':')[1]).toArray().sort(function(a, b) {
            const aKey = version_priority.indexOf(a)
            const bKey = version_priority.indexOf(b);
            return aKey - bKey;
          })[0])
      };
    }).toArray();

    debug(JSON.stringify(versions_by_service));


  } catch (error) {
    setFailed(error.message)
  }
}

run()
