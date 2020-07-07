const core = require('@actions/core')
const github = require('@actions/github')

// Looks for a label with the name from 
async function run() {
    try {
        const ignoreLabel = core.getInput('ignoreLabel')
        const changelogType = core.getInput('changelogType')
        const changelogFilePath = core.getInput('changelogFilePath')
        const changelogDirectoryPath = core.getInput('changelogDirectoryPath')
        const autofail = core.getInput('autofail')
        core.info(`Skip Label: ${ignoreLabel}`)
        if (changelogType != 'file' && changelogType != 'folder' && changelogType != 'both') {
            core.error(`Invalid changelog type: ${changelogType}. Should be one of file, folder, both.`)
        }
        core.info(`Changelog type: ${changelogType}`)

        const pullRequest = github.context.payload.pull_request
        const labelNames = pullRequest.labels.map(l => l.name)
        if (labelNames.includes(ignoreLabel)) {
            return;
        }

        const repository = github.context.payload.repository
        const token = core.getInput('githubToken', {required: true})
        const files = await github.getOctokit(token).pulls.listFiles({
            "owner": repository.owner.login,
            "repo": repository.name,
            "pull_number": pullRequest.number,
            "per_page": 1000
        })

        found = false;
        files.data.forEach((f) => {
            if (changelogType == 'both' || changelogType == 'file') {
                if (f.filename == changelogFilePath) {
                    found = true;
                }
            }
            if (changelogType == 'both' || changelogType == 'folder') {
                if (f.filename.startswith(changelogDirectoryPath)) {
                    found = true
                }
            }
        })

        if ( ! found) {
            if (changelogType == 'both') {
                throw new Error(`No update to ${changelogFilePath} or ${changelogDirectoryPath} found!`)
            } else if (changelogType == 'file') {
                throw new Error(`No update to ${changelogFilePath} found!`)
            } else if (changelogType == 'folder') {
                throw new Error(`No update to ${changelogDirectoryPath} found!`)
            }
        }
    } catch(error) {
        core.setFailed(error.message);
    }
}

run()