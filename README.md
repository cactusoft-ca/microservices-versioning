<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Microservices version auto bumping

This action helps to automatically bump version files, create tag and a release when a closed pull-request with specific labels containing the service name and the release type is found.
The list of files that contain the version that need to be changed will updated in the future depending on usage requirement. At the moment, version files of Helm charts and .Net core projects are supported.
However it is not necessary to change files to tag and create a release.

More paramaters and outputs will be added in the future.

## Usage

This example workflow contains a condition on job level as said before for the workflow to run.
In order to avoid multiple useless versions bumping a guard exist to run the workflow only once with the same context.
if an issue occurs, warning will be added to the run summary.

It is important to checkout the master/main branch before and set the git config.

```YAML
name: Version Bumping

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Version of tag without v"
        required: true
      service:
        description: "Service name"
        required: true
  pull_request:
    types:
      - closed

jobs:
  setup:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'workflow_dispatch' ||
      (github.event.pull_request.merged == true &&
      (contains(toJson(github.event.pull_request.labels.*.name), ':patch') ||
      contains(toJson(github.event.pull_request.labels.*.name), ':minor') ||
      contains(toJson(github.event.pull_request.labels.*.name), ':major')))
    concurrency: version-bumping
    steps:
      - name: Setting variables
        run: |
          echo "UNIQUE_FILE_NAME=${{ github.workflow }}-${{ github.run_id }}-${{ github.run_number }}" >> $GITHUB_ENV
          echo "CACHE_PATH=${{ github.workspace }}/firstrun" >> $GITHUB_ENV

      - name: Cache workflow run
        id: cache-workflow-run
        uses: actions/cache@v2
        env:
          cache-name: ${{ env.UNIQUE_FILE_NAME }}
        with:
          path: ${{ env.CACHE_PATH }}
          key: ${{ runner.os }}-${{ env.cache-name }}

      - name: "Checkout"
        if: steps.cache-workflow-run.outputs.cache-hit != 'true'
        uses: actions/checkout@v2
        with:
          ref: master
      - run: |
          git config --global user.email "${{ secrets.AUTO_BUMP_MAIL }}"
          git config --global user.name "${{ secrets.AUTO_BUMP_NAME }}"

      - name: Microservices verisoning action
        if: steps.cache-workflow-run.outputs.cache-hit != 'true' && github.event_name != 'workflow_dispatch'
        uses: cactusoft-ca/microservices-versioning@main
        id: microservices_versioning
        with:
          pull_number: ${{ github.event.number }}
          owner: cactusoft-ca
          repo: microservices-versioning
          token: ${{ secrets.GITHUB_TOKEN }}
          working_directory: ${{ github.workspace }}
          services_path: "services"
          custom_services_path: |
            service2,custom/service2/path

      # results is empty atm
      - name: Saving first run results
        if: steps.cache-workflow-run.outputs.cache-hit == 'true'
        run: |
          echo "${{ steps.microservices_versioning.outputs.results }}" > ${{ env.CACHE_PATH }}

      - name: Workflow already triggered
        if: steps.cache-workflow-run.outputs.cache-hit == 'true'
        run: |
          echo "Already runned" > ${{ env.CACHE_PATH }}
```