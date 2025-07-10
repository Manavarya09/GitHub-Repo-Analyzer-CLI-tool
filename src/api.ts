import axios, { AxiosInstance, AxiosResponse } from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  LanguageBreakdown,
  RepositoryAnalysis,
  UserAnalysis,
  APIConfig,
} from '../types';

export class GitHubAPI {
  private client: AxiosInstance;
  private token?: string;

  constructor(config: APIConfig) {
    this.token = config.token;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitHub-Repo-Analyzer-CLI/1.0.0',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use((config) => {
      console.log(chalk.dim(`🔗 Making request to: ${config.url}`));
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error(chalk.red('❌ Authentication failed. Please check your GitHub token.'));
        } else if (error.response?.status === 403) {
          console.error(chalk.red('❌ Rate limit exceeded or access forbidden.'));
        } else if (error.response?.status === 404) {
          console.error(chalk.red('❌ Repository or user not found.'));
        } else {
          console.error(chalk.red(`❌ API Error: ${error.message}`));
        }
        throw error;
      }
    );
  }

  /**
   * Get user information
   */
  async getUser(username: string): Promise<GitHubUser> {
    const spinner = ora(`Fetching user information for ${username}`).start();

    try {
      const response: AxiosResponse<GitHubUser> = await this.client.get(`/users/${username}`);
      spinner.succeed(chalk.green(`✅ Found user: ${response.data.name || username}`));
      return response.data;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to fetch user: ${username}`));
      throw error;
    }
  }

  /**
   * Get user's public repositories
   */
  async getUserRepositories(username: string, perPage: number = 100): Promise<GitHubRepository[]> {
    const spinner = ora(`Fetching repositories for ${username}`).start();

    try {
      const repositories: GitHubRepository[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response: AxiosResponse<GitHubRepository[]> = await this.client.get(
          `/users/${username}/repos`,
          {
            params: {
              type: 'public',
              sort: 'updated',
              direction: 'desc',
              per_page: perPage,
              page,
            },
          }
        );

        repositories.push(...response.data);
        hasMore = response.data.length === perPage;
        page++;

        spinner.text = `Fetching repositories for ${username} (${repositories.length} found)`;
      }

      spinner.succeed(chalk.green(`✅ Found ${repositories.length} repositories for ${username}`));
      return repositories;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to fetch repositories for: ${username}`));
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const spinner = ora(`Fetching repository details for ${owner}/${repo}`).start();

    try {
      const response: AxiosResponse<GitHubRepository> = await this.client.get(
        `/repos/${owner}/${repo}`
      );
      spinner.succeed(chalk.green(`✅ Found repository: ${response.data.full_name}`));
      return response.data;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to fetch repository: ${owner}/${repo}`));
      throw error;
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<LanguageBreakdown> {
    const spinner = ora(`Analyzing languages for ${owner}/${repo}`).start();

    try {
      const response: AxiosResponse<LanguageBreakdown> = await this.client.get(
        `/repos/${owner}/${repo}/languages`
      );

      const totalBytes = Object.values(response.data).reduce((sum, bytes) => sum + bytes, 0);
      const languages: LanguageBreakdown = {};

      // Convert to percentages and round to 2 decimal places
      Object.entries(response.data).forEach(([language, bytes]) => {
        languages[language] = Math.round((bytes / totalBytes) * 10000) / 100; // Percentage with 2 decimals
      });

      spinner.succeed(chalk.green(`✅ Analyzed ${Object.keys(languages).length} languages`));
      return languages;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to fetch languages for: ${owner}/${repo}`));
      return {};
    }
  }

  /**
   * Get latest commit for repository
   */
  async getLatestCommit(owner: string, repo: string): Promise<GitHubCommit | null> {
    try {
      const response: AxiosResponse<GitHubCommit[]> = await this.client.get(
        `/repos/${owner}/${repo}/commits`,
        {
          params: {
            per_page: 1,
            page: 1,
          },
        }
      );

      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not fetch latest commit for ${owner}/${repo}`));
      return null;
    }
  }

  /**
   * Analyze a repository and return comprehensive data
   */
  async analyzeRepository(owner: string, repo: string): Promise<RepositoryAnalysis> {
    const spinner = ora(`Analyzing repository ${owner}/${repo}`).start();

    try {
      // Fetch repository details, languages, and latest commit in parallel
      const [repository, languages, latestCommit] = await Promise.all([
        this.getRepository(owner, repo),
        this.getRepositoryLanguages(owner, repo),
        this.getLatestCommit(owner, repo),
      ]);

      const analysis: RepositoryAnalysis = {
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        url: repository.html_url,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        open_issues: repository.open_issues_count,
        last_commit_date: latestCommit?.commit.committer.date || repository.pushed_at,
        languages,
        created_at: repository.created_at,
        updated_at: repository.updated_at,
        license: repository.license?.name || null,
        topics: repository.topics,
        size: repository.size,
        default_branch: repository.default_branch,
      };

      spinner.succeed(chalk.green(`✅ Analysis complete for ${repository.full_name}`));
      return analysis;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to analyze repository: ${owner}/${repo}`));
      throw error;
    }
  }

  /**
   * Analyze a user and their repositories
   */
  async analyzeUser(username: string, maxRepos: number = 10): Promise<UserAnalysis> {
    const spinner = ora(`Analyzing user ${username}`).start();

    try {
      // Fetch user details and repositories
      const [user, repositories] = await Promise.all([
        this.getUser(username),
        this.getUserRepositories(username),
      ]);

      spinner.text = `Analyzing top ${Math.min(maxRepos, repositories.length)} repositories for ${username}`;

      // Analyze top repositories (by stars, then by recent activity)
      const sortedRepos = repositories
        .filter(repo => !repo.fork) // Exclude forks
        .sort((a, b) => {
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count;
          }
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .slice(0, maxRepos);

      const repositoryAnalyses: RepositoryAnalysis[] = [];

      for (const repo of sortedRepos) {
        try {
          const languages = await this.getRepositoryLanguages(repo.owner.login, repo.name);
          const latestCommit = await this.getLatestCommit(repo.owner.login, repo.name);

          repositoryAnalyses.push({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            open_issues: repo.open_issues_count,
            last_commit_date: latestCommit?.commit.committer.date || repo.pushed_at,
            languages,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            license: repo.license?.name || null,
            topics: repo.topics,
            size: repo.size,
            default_branch: repo.default_branch,
          });

          spinner.text = `Analyzed ${repositoryAnalyses.length}/${sortedRepos.length} repositories for ${username}`;
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Skipping repository ${repo.full_name} due to error`));
        }
      }

      const analysis: UserAnalysis = {
        username: user.login,
        name: user.name,
        bio: user.bio,
        location: user.location,
        email: user.email,
        blog: user.blog,
        company: user.company,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        repositories: repositoryAnalyses,
      };

      spinner.succeed(chalk.green(`✅ Analysis complete for user ${username}`));
      return analysis;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Failed to analyze user: ${username}`));
      throw error;
    }
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<void> {
    try {
      const response = await this.client.get('/rate_limit');
      const { core } = response.data.resources;

      console.log(chalk.blue(`📊 Rate Limit Status:`));
      console.log(chalk.dim(`   Remaining: ${core.remaining}/${core.limit}`));
      console.log(chalk.dim(`   Reset: ${new Date(core.reset * 1000).toLocaleString()}`));

      if (core.remaining < 10) {
        console.warn(chalk.yellow(`⚠️  Warning: Low rate limit remaining (${core.remaining})`));
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not fetch rate limit information'));
    }
  }
}

/**
 * Create and configure GitHub API client
 */
export function createGitHubAPI(token?: string): GitHubAPI {
  const config: APIConfig = {
    baseURL: 'https://api.github.com',
    timeout: 30000, // 30 seconds
    token,
  };

  return new GitHubAPI(config);
}
