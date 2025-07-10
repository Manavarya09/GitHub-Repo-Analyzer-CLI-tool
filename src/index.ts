#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { createGitHubAPI } from './api';
import {
  parseGitHubUrl,
  isGitHubUsername,
  displayRepositoryAnalysis,
  displayUserAnalysis,
  saveToJson,
  saveToMarkdown,
  createTimestampedFilename,
  sanitizeFilename,
} from './utils';
import { CLIOptions } from '../types';

// Load environment variables
dotenv.config();

// Create CLI program
const program = new Command();

program
  .name('github-analyzer')
  .description('🔍 A powerful CLI tool to analyze GitHub repositories and users')
  .version('1.0.0');

/**
 * Analyze repository command
 */
program
  .command('repo')
  .description('📁 Analyze a specific GitHub repository')
  .argument('<repo-url>', 'GitHub repository URL or owner/repo format')
  .option('-o, --output <format>', 'Output format (json|md)', 'console')
  .option('-s, --save <filename>', 'Save results to file')
  .option('-t, --token <token>', 'GitHub personal access token')
  .action(async (repoUrl: string, options: CLIOptions) => {
    try {
      console.log(chalk.blue.bold('🔍 GitHub Repository Analyzer\n'));

      // Parse repository URL
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed.isValid) {
        console.error(chalk.red(`❌ Invalid repository URL or format: ${repoUrl}`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log('   • https://github.com/owner/repo');
        console.log('   • git@github.com:owner/repo.git');
        console.log('   • owner/repo');
        process.exit(1);
      }

      // Get GitHub token
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token) {
        console.warn(chalk.yellow('⚠️  No GitHub token provided. Rate limiting may apply.'));
        console.log(chalk.dim('   Set GITHUB_TOKEN environment variable or use --token flag'));
      }

      // Create API client
      const github = createGitHubAPI(token);

      // Check rate limit
      if (token) {
        await github.checkRateLimit();
      }

      // Analyze repository
      console.log(chalk.blue(`🔍 Analyzing repository: ${parsed.owner}/${parsed.repo}\n`));
      const analysis = await github.analyzeRepository(parsed.owner, parsed.repo);

      // Display results
      if (options.output === 'console' || !options.output) {
        displayRepositoryAnalysis(analysis);
      }

      // Save results
      if (options.save || options.output !== 'console') {
        const filename = options.save || createTimestampedFilename(
          sanitizeFilename(`${parsed.owner}-${parsed.repo}`),
          options.output === 'md' ? 'md' : 'json'
        );

        if (options.output === 'md') {
          await saveToMarkdown(analysis, filename);
        } else {
          await saveToJson(analysis, filename);
        }
      }

      console.log(chalk.green('\n✅ Analysis completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error analyzing repository: ${error}`));
      process.exit(1);
    }
  });

/**
 * Analyze user command
 */
program
  .command('user')
  .description('👤 Analyze a GitHub user and their repositories')
  .argument('<username>', 'GitHub username')
  .option('-r, --repos <number>', 'Maximum number of repositories to analyze', '10')
  .option('-o, --output <format>', 'Output format (json|md)', 'console')
  .option('-s, --save <filename>', 'Save results to file')
  .option('-t, --token <token>', 'GitHub personal access token')
  .action(async (username: string, options: CLIOptions & { repos?: string }) => {
    try {
      console.log(chalk.blue.bold('🔍 GitHub User Analyzer\n'));

      // Validate username
      if (!isGitHubUsername(username)) {
        console.error(chalk.red(`❌ Invalid GitHub username: ${username}`));
        console.log(chalk.yellow('\n💡 Username should only contain letters, numbers, and hyphens'));
        process.exit(1);
      }

      // Get GitHub token
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token) {
        console.warn(chalk.yellow('⚠️  No GitHub token provided. Rate limiting may apply.'));
        console.log(chalk.dim('   Set GITHUB_TOKEN environment variable or use --token flag'));
      }

      // Parse max repos
      const maxRepos = parseInt(options.repos || '10', 10);
      if (isNaN(maxRepos) || maxRepos < 1 || maxRepos > 50) {
        console.error(chalk.red('❌ Invalid number of repositories. Must be between 1 and 50.'));
        process.exit(1);
      }

      // Create API client
      const github = createGitHubAPI(token);

      // Check rate limit
      if (token) {
        await github.checkRateLimit();
      }

      // Analyze user
      console.log(chalk.blue(`🔍 Analyzing user: ${username}\n`));
      const analysis = await github.analyzeUser(username, maxRepos);

      // Display results
      if (options.output === 'console' || !options.output) {
        displayUserAnalysis(analysis);
      }

      // Save results
      if (options.save || options.output !== 'console') {
        const filename = options.save || createTimestampedFilename(
          sanitizeFilename(username),
          options.output === 'md' ? 'md' : 'json'
        );

        if (options.output === 'md') {
          await saveToMarkdown(analysis, filename);
        } else {
          await saveToJson(analysis, filename);
        }
      }

      console.log(chalk.green('\n✅ Analysis completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error analyzing user: ${error}`));
      process.exit(1);
    }
  });

/**
 * Analyze command (auto-detect repo or user)
 */
program
  .command('analyze')
  .description('🤖 Auto-analyze GitHub repository or user')
  .argument('<input>', 'GitHub repository URL, owner/repo, or username')
  .option('-r, --repos <number>', 'Maximum repositories for user analysis', '10')
  .option('-o, --output <format>', 'Output format (json|md)', 'console')
  .option('-s, --save <filename>', 'Save results to file')
  .option('-t, --token <token>', 'GitHub personal access token')
  .action(async (input: string, options: CLIOptions & { repos?: string }) => {
    try {
      console.log(chalk.blue.bold('🔍 GitHub Auto-Analyzer\n'));

      // Try to parse as repository URL first
      const parsed = parseGitHubUrl(input);

      if (parsed.isValid) {
        // It's a repository URL
        console.log(chalk.cyan('🔍 Detected: Repository URL\n'));

        // Get GitHub token
        const token = options.token || process.env.GITHUB_TOKEN;
        const github = createGitHubAPI(token);

        if (token) await github.checkRateLimit();

        const analysis = await github.analyzeRepository(parsed.owner, parsed.repo);

        if (options.output === 'console' || !options.output) {
          displayRepositoryAnalysis(analysis);
        }

        if (options.save || options.output !== 'console') {
          const filename = options.save || createTimestampedFilename(
            sanitizeFilename(`${parsed.owner}-${parsed.repo}`),
            options.output === 'md' ? 'md' : 'json'
          );

          if (options.output === 'md') {
            await saveToMarkdown(analysis, filename);
          } else {
            await saveToJson(analysis, filename);
          }
        }
      } else if (isGitHubUsername(input)) {
        // It's a username
        console.log(chalk.cyan('🔍 Detected: GitHub Username\n'));

        const token = options.token || process.env.GITHUB_TOKEN;
        const github = createGitHubAPI(token);
        const maxRepos = parseInt(options.repos || '10', 10);

        if (token) await github.checkRateLimit();

        const analysis = await github.analyzeUser(input, maxRepos);

        if (options.output === 'console' || !options.output) {
          displayUserAnalysis(analysis);
        }

        if (options.save || options.output !== 'console') {
          const filename = options.save || createTimestampedFilename(
            sanitizeFilename(input),
            options.output === 'md' ? 'md' : 'json'
          );

          if (options.output === 'md') {
            await saveToMarkdown(analysis, filename);
          } else {
            await saveToJson(analysis, filename);
          }
        }
      } else {
        console.error(chalk.red(`❌ Could not determine if "${input}" is a repository URL or username`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log('   Repository: owner/repo, https://github.com/owner/repo');
        console.log('   Username: valid GitHub username');
        process.exit(1);
      }

      console.log(chalk.green('\n✅ Analysis completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error during analysis: ${error}`));
      process.exit(1);
    }
  });

/**
 * Rate limit command
 */
program
  .command('rate-limit')
  .description('📊 Check GitHub API rate limit status')
  .option('-t, --token <token>', 'GitHub personal access token')
  .action(async (options: CLIOptions) => {
    try {
      const token = options.token || process.env.GITHUB_TOKEN;

      if (!token) {
        console.error(chalk.red('❌ GitHub token required for rate limit check'));
        console.log(chalk.yellow('   Set GITHUB_TOKEN environment variable or use --token flag'));
        process.exit(1);
      }

      const github = createGitHubAPI(token);
      await github.checkRateLimit();
    } catch (error) {
      console.error(chalk.red(`❌ Error checking rate limit: ${error}`));
      process.exit(1);
    }
  });

/**
 * Global options and help
 */
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

// Add help examples
program.addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.dim('# Analyze a repository')}
  $ github-analyzer repo facebook/react
  $ github-analyzer repo https://github.com/microsoft/vscode

  ${chalk.dim('# Analyze a user')}
  $ github-analyzer user octocat
  $ github-analyzer user octocat --repos 5

  ${chalk.dim('# Auto-detect and analyze')}
  $ github-analyzer analyze facebook/react
  $ github-analyzer analyze octocat

  ${chalk.dim('# Save results to file')}
  $ github-analyzer repo facebook/react --output json --save react-analysis.json
  $ github-analyzer user octocat --output md --save octocat-report.md

  ${chalk.dim('# Use with GitHub token')}
  $ github-analyzer repo facebook/react --token ghp_xxxxxxxxxxxx

${chalk.yellow('Environment Variables:')}
  ${chalk.dim('GITHUB_TOKEN')}    GitHub personal access token for higher rate limits

${chalk.yellow('More Info:')}
  ${chalk.dim('GitHub tokens:')} https://github.com/settings/tokens
  ${chalk.dim('Rate limits:')}   https://docs.github.com/en/rest/overview/rate-limits
`);

// Handle unrecognized commands
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('\nRun "github-analyzer --help" for available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
