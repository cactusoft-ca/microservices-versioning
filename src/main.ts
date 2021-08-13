/* eslint-disable prettier/prettier */
import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

async function run(): Promise<void> {
  try {
    const pull_number: string = core.getInput('pull_number')
    const owner: string = core.getInput('owner')
    const repo: string = core.getInput('pull_number')

    core.debug(`Checking labels for pull request number ${pull_number}`)
    const octokit = new Octokit()

    const pull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number: Number(pull_number)
    })

    core.debug(`Labels ${pull.data.labels}`)


  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
