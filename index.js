#!/usr/bin/env node

const { execSync } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');

// Check if we're in a git repository
function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get the current branch name
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(chalk.red('Error getting current branch:', error.message));
    return null;
  }
}

// Get recent branches sorted by last commit date
function getRecentBranches(limit = 5) {
  try {
    // Get all branches sorted by committerdate (most recent first)
    const branchesOutput = execSync(
      'git for-each-ref --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)|%(committerdate:unix)" refs/heads/',
      { encoding: 'utf8' }
    );

    const currentBranch = getCurrentBranch();
    const branches = branchesOutput
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [name, relativeTime, timestamp] = line.split('|');
        return {
          name,
          relativeTime,
          timestamp: parseInt(timestamp),
          isCurrent: name === currentBranch
        };
      })
      .filter(branch => !branch.isCurrent) // Exclude current branch from the list
      .slice(0, limit);

    return branches;
  } catch (error) {
    console.error(chalk.red('Error getting branches:', error.message));
    return [];
  }
}

// Checkout to a branch
async function checkoutBranch(branchName) {
  const spinner = ora(`Switching to branch ${chalk.cyan(branchName)}`).start();

  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status) {
      spinner.warn(chalk.yellow('You have uncommitted changes.'));
      const { shouldStash } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldStash',
          message: 'Would you like to stash your changes before switching?',
          default: true
        }
      ]);

      if (shouldStash) {
        spinner.text = 'Stashing changes...';
        execSync('git stash push -m "Auto-stash before branch switch"');
        spinner.succeed(chalk.green('Changes stashed'));
      } else {
        spinner.fail(chalk.red('Branch switch cancelled'));
        return false;
      }
    }

    // Perform the checkout
    execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
    spinner.succeed(chalk.green(`Successfully switched to branch ${chalk.cyan(branchName)}`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Failed to checkout branch: ${error.message}`));
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold.blue('\n🌿 Git Branch Switcher\n'));

  // Check if we're in a git repository
  if (!isGitRepo()) {
    console.error(chalk.red('Error: Not in a git repository!'));
    console.log(chalk.yellow('Please run this command from within a git repository.'));
    process.exit(1);
  }

  const currentBranch = getCurrentBranch();
  if (currentBranch) {
    console.log(chalk.gray(`Current branch: ${chalk.cyan(currentBranch)}\n`));
  }

  // Get recent branches
  const branches = getRecentBranches(5);

  if (branches.length === 0) {
    console.log(chalk.yellow('No other branches found in this repository.'));
    process.exit(0);
  }

  // Prepare choices for inquirer
  const choices = branches.map(branch => ({
    name: `${chalk.cyan(branch.name.padEnd(30))} ${chalk.gray(branch.relativeTime)}`,
    value: branch.name,
    short: branch.name
  }));

  // Add a cancel option
  choices.push(new inquirer.Separator());
  choices.push({
    name: chalk.gray('Cancel'),
    value: null,
    short: 'Cancel'
  });

  // Show the interactive menu
  const { selectedBranch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedBranch',
      message: 'Select a branch to checkout:',
      choices: choices,
      pageSize: 10
    }
  ]);

  if (selectedBranch === null) {
    console.log(chalk.gray('\nOperation cancelled.'));
    process.exit(0);
  }

  // Checkout the selected branch
  await checkoutBranch(selectedBranch);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('An unexpected error occurred:', error.message));
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error(chalk.red('Fatal error:', error.message));
  process.exit(1);
});