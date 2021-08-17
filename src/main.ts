/* eslint-disable prettier/prettier */
import github from '@actions/github'
import core from '@actions/core'

async function run(): Promise<void> {
  try {
    const pull_number = Number(core.getInput('pull_number'))
    const owner: string = core.getInput('owner')
    const repo: string = core.getInput('pull_number')
    const myToken: string = core.getInput('token')

    core.debug(`Context repo owner: ${github.context.repo.owner}`)
    core.debug(`Checking labels for pull request number ${pull_number}`)
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret

    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: {
        format: 'diff'
      }
    })

    core.debug(JSON.stringify(pullRequest))

    // debug(`Labels ${pull.data.labels}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
