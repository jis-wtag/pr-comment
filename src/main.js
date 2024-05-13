const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })

    const octokit = new github.getOctokit(token);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number
    })

    let diffData = {
      addition: 0,
      deletion: 0,
      changes: 0
    }

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions += file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
      Pull request #$[pr_number] has been update with \n
      - ${diffData.changes} changes \n
      - ${diffData.additions} additions \n
      - ${diffData.deletions} deletions \n
      `
    })

    const labelsToAdd = []
    for (const file of changedFiles) {
      const fileExtension = file.filename.split('.').pop()

      let label = ''
      switch (fileExtension) {
        case 'md':
          label = 'markdown'
          break
        case 'js':
          label = 'javascript'
          break
        case 'yml':
        case 'yaml':
          label = 'yaml'
          break
        default:
          label = 'noextension'
          break
      }

      labelsToAdd.push(label)
    }

    // Remove duplicate labels
    const uniqueLabels = Array.from(new Set(labelsToAdd))

    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr_number,
      labels: uniqueLabels
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}

// Adding few lines to check the actions.yml
// Ready to test custom github actions
// remove it later on
