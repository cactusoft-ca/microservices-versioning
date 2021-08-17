/* eslint-disable prettier/prettier */
import {setFailed, getInput, debug} from '@actions/core'
import { getOctokit ,context} from "@actions/github"


async function run(): Promise<void> {
  try {
    const pull_number: string = core.getInput('pull_number')
    const owner: string = core.getInput('owner')
    const repo: string = core.getInput('repo')
    const token: string = core.getInput('token')

    debug(`Context repo owner: ${context.repo.owner}`)
    debug(`Checking labels for pull request number ${pull_number}`)
    const octokit = getOctokit(token)

    const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number)
    })

    debug(`Labels ${pull.data.labels}`)


  } catch (error) {
    setFailed(error.message)
  }
}

run()
