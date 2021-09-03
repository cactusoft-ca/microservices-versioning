import simpleGit, { CommitResult, PushResult, SimpleGit, StatusResult } from 'simple-git';
import { debug, setFailed, warning } from '@actions/core'
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
            throw new Error(`FATAL: An error occured while commiting: "${message}.\n ${error}`)
        }

    }

    public async commitGeneratedCode(message: string): Promise<CommitResult | StatusResult >{
        const status = await this.git.status();
        console.log(`Status: ${JSON.stringify(status, null, 2)}`)

        if (status.files.length > 0) {
            const add = await this.git.add(status.files.map(x => x.path))
            console.log(add)
            return await this.commit(message)
        }

        return status
    }

    public async createAnnotatedTag(service: ServiceSemVer): Promise<{ name: string }> {
        try {
            debug(`Creating an annonated tag for service ${service.name}`)
            const result = await this.git.addAnnotatedTag(service.getNextVersionTag(), service.getNextVersionMessage());
            debug(`Creating an annonated tag result ${JSON.stringify(result, null, 2)}`)
            return result;
        } catch (error) {
            warning(error)
            throw new Error(`FATAL: An error occured while creating a new tag for service: "${service.name}.\n ${error}`)
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
            throw new Error(`FATAL: An error occured while pushing commits and new tag for service: "${service.name}.\n ${error}`)
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
            return createReleaseResponse;
        } catch (error) {
            setFailed(error.message);
        }
    }
}
