import simpleGit, { CommitResult, PushResult, SimpleGit } from 'simple-git';
import { debug, setOutput, setFailed, warning } from '@actions/core'
import { ServiceSemVer } from './service-sem-ver';
import { graphql } from "@octokit/graphql";
import { getOctokit, context } from "@actions/github"

export class GitService {

    private git: SimpleGit;
    private token: string;

    constructor(repo: string, token: string) {
        debug(`Context repo owner from GitService: ${context.repo.owner}`)
        this.git = simpleGit(repo, { binary: 'git' });
        debug(`Is git repo: ${JSON.stringify(this.git.checkIsRepo())}`)
        this.token = token;
    }

    public async addFile(path: string): Promise<string> {
        const result = await this.git.add(path);
        debug(result)
        return result;
    }

    public async commit(message: string): Promise<CommitResult> {
        try {
            debug(`Commiting ${message}`)
            const result = await this.git.commit(message)
            debug(`Commit result ${JSON.stringify(result, null, 2)}`)
            return result;
        } catch (error) {
            throw new Error(`An error occured while commiting: "${message}.\n ${error}`)
        }

    }

    public async createAnnotatedTag(service: ServiceSemVer): Promise<{ name: string }> {
        try {
            debug(`Creating an annonated tag for service ${service.name}`)
            const result = await this.git.addAnnotatedTag(service.getNextVersionTag(), service.getNextVersionMessage());
            debug(`Creating an annonated tag result ${JSON.stringify(result, null, 2)}`)
            return result;
        } catch (error) {
            warning(error)
            throw new Error(`An error occured while creating a new tag for service: "${service.name}.\n ${error}`)
        }
    }

    public async pushAll(service: ServiceSemVer): Promise<PushResult[]> {
        try {
            debug(`Pushing all changes service ${service.name}`)
            const pushRes = await this.git.push();
            debug(`Push result ${JSON.stringify(pushRes, null, 2)}`)

            const tagPushRes = await this.git.pushTags();
            debug(`Tag push result ${JSON.stringify(tagPushRes, null, 2)}`)
            return [pushRes, tagPushRes];
        } catch (error) {
            throw new Error(`An error occured while pushing commits and new tag for service: "${service.name}.\n ${error}`)
        }
    }

    public async getLatestTagByServiceName(serviceName: string, owner: string, repo: string) {
        debug(`GH GraphQL API - Getting current version for ${serviceName} from ${owner}/${repo}`)

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

        debug(`GH GraphQl result: \n ${JSON.stringify(repository, null, 2)}`)
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
