// GitHub API response types and interfaces

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: {
    sha: string;
    url: string;
    html_url: string;
  }[];
}

export interface LanguageBreakdown {
  [language: string]: number;
}

export interface RepositoryAnalysis {
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  open_issues: number;
  last_commit_date: string;
  languages: LanguageBreakdown;
  created_at: string;
  updated_at: string;
  license: string | null;
  topics: string[];
  size: number;
  default_branch: string;
}

export interface UserAnalysis {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  email: string | null;
  blog: string;
  company: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  repositories: RepositoryAnalysis[];
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  isValid: boolean;
}

export interface CLIOptions {
  output?: 'json' | 'md';
  save?: string;
  token?: string;
}

export interface APIConfig {
  baseURL: string;
  token?: string;
  timeout: number;
}
