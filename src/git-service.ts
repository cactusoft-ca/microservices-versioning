import simpleGit, { CommitResult, PushResult, SimpleGit } from 'simple-git';
import { debug, setOutput, setFailed } from '@actions/core'
import { ServiceSemVer } from './service-sem-ver';
import { graphql } from "@octokit/graphql";
import { getOctokit, context } from "@actions/github"

export class GitService {

    private git: SimpleGit;
    private token: string;

    constructor(repo: string, token: string) {
        debug(`Context repo owner from GitService: ${context.repo.owner}`)
        this.git = simpleGit(repo, { binary: 'git' });
        debug(`Is git repo: ${this.git.checkIsRepo()}`)
        this.token = token;
    }

    public async addFile(path: string): Promise<string> {
        const result = await this.git.add(path);
        console.log(result)
        return result;
    }

    public async commit(message: string): Promise<CommitResult> {
        const result = await this.git.commit(message)
        console.log(result.commit)
        return result;
    }

    public async createAnnotatedTag(service: ServiceSemVer): Promise<{ name: string }> {
        debug(`Creating an annonated tag for service ${service.name}`)
        const result = await this.git.addAnnotatedTag(service.getNextVersionTag(), service.getNextVersionMessage());
        console.log(result.name)
        return result;
    }

    public async pushAll(service: ServiceSemVer): Promise<PushResult[]> {
        debug(`Pushing all changes service ${service.name}`)
        const pushRes = await this.git.push();
        console.log(pushRes)

        const tagPushRes = await this.git.pushTags();
        console.log(tagPushRes)

        return [pushRes, tagPushRes];
    }

    public async getLatestTagByServiceName(serviceName: string, owner: string, repo: string) {
        console.log(`Getting current version for ${serviceName} from ${owner}/${repo}`)

        const graphqlWithAuth = graphql.defaults({
            headers: {
                authorization: `token ${this.token}`,
            },
        });

        const { repository } = await graphqlWithAuth(`
        {
          repository(owner: "${owner}", name: "${repo}") {
            refs(refPrefix: "refs/tags/", query: "${serviceName}", orderBy: {field: TAG_COMMIT_DATE, direction: ASC}, last: 1) {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `);

        const result = repository.refs.edges[0].node.name.replace(`${serviceName}/v`, '');
        return result as string
    }

    public async createRelease(
        owner: string,
        repo: string,
        tag: string,
        body: string,
        draft = true,
        prerelease = true,
    ) {
        try {
            debug(`Creating release with tag ${tag} for ${owner}/${repo} `)
            // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
            const octokit = getOctokit(this.token)

            // Create a release
            // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
            // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
            const createReleaseResponse = await octokit.rest.repos.createRelease({
                owner,
                repo,
                tag_name: tag,
                name: tag,
                body: body,
                draft,
                prerelease
            });

            // Get the ID, html_url, and upload URL for the created Release from the response
            const {
                data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
            } = createReleaseResponse;

            // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
            setOutput('id', releaseId);
            setOutput('html_url', htmlUrl);
            setOutput('upload_url', uploadUrl);

            return createReleaseResponse;
        } catch (error) {
            setFailed(error.message);
        }
    }
}
