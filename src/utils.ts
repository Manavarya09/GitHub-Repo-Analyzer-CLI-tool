import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ParsedGitHubUrl, RepositoryAnalysis, UserAnalysis, LanguageBreakdown } from '../types';

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(input: string): ParsedGitHubUrl {
  // Remove trailing slashes and whitespace
  const cleanInput = input.trim().replace(/\/+$/, '');

  // Patterns for different GitHub URL formats
  const patterns = [
    // https://github.com/owner/repo
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/,
    // git@github.com:owner/repo.git
    /^git@github\.com:([^\/]+)\/([^\/]+)(?:\.git)?$/,
    // owner/repo
    /^([^\/\s]+)\/([^\/\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const [, owner, repo] = match;
      return {
        owner: owner.trim(),
        repo: repo.trim(),
        isValid: true,
      };
    }
  }

  return {
    owner: '',
    repo: '',
    isValid: false,
  };
}

/**
 * Check if input is a GitHub username (not a URL)
 */
export function isGitHubUsername(input: string): boolean {
  const cleanInput = input.trim();

  // If it contains slashes or looks like a URL, it's not a username
  if (cleanInput.includes('/') || cleanInput.includes('http') || cleanInput.includes('git@')) {
    return false;
  }

  // GitHub username constraints
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  return usernamePattern.test(cleanInput) && cleanInput.length <= 39;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${size} ${sizes[i]}`;
}

/**
 * Format date in a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Generate colored progress bar for languages
 */
export function generateLanguageBar(languages: LanguageBreakdown, width: number = 50): string {
  const colors = [
    chalk.red,
    chalk.green,
    chalk.yellow,
    chalk.blue,
    chalk.magenta,
    chalk.cyan,
    chalk.white,
  ];

  let bar = '';
  let colorIndex = 0;

  Object.entries(languages).forEach(([language, percentage]) => {
    const segmentWidth = Math.round((percentage / 100) * width);
    const color = colors[colorIndex % colors.length];
    bar += color('█'.repeat(segmentWidth));
    colorIndex++;
  });

  // Fill remaining space with gray
  const usedWidth = Object.values(languages).reduce(
    (sum, percentage) => sum + Math.round((percentage / 100) * width),
    0
  );
  const remainingWidth = width - usedWidth;
  if (remainingWidth > 0) {
    bar += chalk.gray('░'.repeat(remainingWidth));
  }

  return bar;
}

/**
 * Save data to JSON file
 */
export async function saveToJson(data: any, filename: string): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    const fullPath = path.resolve(filename);

    // Ensure directory exists
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(fullPath, jsonData, 'utf8');
    console.log(chalk.green(`✅ Data saved to: ${fullPath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to save JSON file: ${error}`));
    throw error;
  }
}

/**
 * Generate markdown report for repository analysis
 */
export function generateRepositoryMarkdown(analysis: RepositoryAnalysis): string {
  const markdown = `# ${analysis.name}

## Repository Information

- **Full Name**: ${analysis.full_name}
- **Description**: ${analysis.description || 'No description available'}
- **URL**: [${analysis.url}](${analysis.url})
- **Created**: ${formatDate(analysis.created_at)}
- **Last Updated**: ${formatDate(analysis.updated_at)}
- **Last Commit**: ${formatDate(analysis.last_commit_date)}

## Repository Statistics

| Metric | Value |
|--------|--------|
| ⭐ Stars | ${analysis.stars.toLocaleString()} |
| 🍴 Forks | ${analysis.forks.toLocaleString()} |
| 🐛 Open Issues | ${analysis.open_issues.toLocaleString()} |
| 📦 Size | ${formatFileSize(analysis.size * 1024)} |
| 📄 License | ${analysis.license || 'No license'} |
| 🌿 Default Branch | ${analysis.default_branch} |

## Programming Languages

${Object.keys(analysis.languages).length > 0 
  ? Object.entries(analysis.languages)
      .sort(([,a], [,b]) => b - a)
      .map(([language, percentage]) => `- **${language}**: ${percentage.toFixed(2)}%`)
      .join('\n')
  : 'No language data available'
}

## Topics

${analysis.topics.length > 0 
  ? analysis.topics.map(topic => `\`${topic}\``).join(' ')
  : 'No topics specified'
}

---

*Report generated by GitHub Repo Analyzer CLI on ${new Date().toLocaleString()}*
`;

  return markdown;
}

/**
 * Generate markdown report for user analysis
 */
export function generateUserMarkdown(analysis: UserAnalysis): string {
  const markdown = `# ${analysis.name || analysis.username}

## User Information

- **Username**: [@${analysis.username}](https://github.com/${analysis.username})
- **Name**: ${analysis.name || 'Not specified'}
- **Bio**: ${analysis.bio || 'No bio available'}
- **Location**: ${analysis.location || 'Not specified'}
- **Company**: ${analysis.company || 'Not specified'}
- **Blog**: ${analysis.blog || 'Not specified'}
- **Email**: ${analysis.email || 'Not specified'}
- **Member Since**: ${formatDate(analysis.created_at)}

## GitHub Statistics

| Metric | Value |
|--------|--------|
| 📚 Public Repositories | ${analysis.public_repos.toLocaleString()} |
| 👥 Followers | ${analysis.followers.toLocaleString()} |
| 👤 Following | ${analysis.following.toLocaleString()} |

## Top Repositories

${analysis.repositories.length > 0 
  ? analysis.repositories.map((repo, index) => `
### ${index + 1}. [${repo.name}](${repo.url})

${repo.description || 'No description available'}

- ⭐ **Stars**: ${repo.stars.toLocaleString()}
- 🍴 **Forks**: ${repo.forks.toLocaleString()}
- 🐛 **Open Issues**: ${repo.open_issues.toLocaleString()}
- 🗓️ **Last Updated**: ${formatDate(repo.updated_at)}
- 📄 **License**: ${repo.license || 'No license'}

**Languages**: ${Object.keys(repo.languages).length > 0
    ? Object.entries(repo.languages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([lang, pct]) => `${lang} (${pct.toFixed(1)}%)`)
        .join(', ')
    : 'No language data'
}

${repo.topics.length > 0 ? `**Topics**: ${repo.topics.map(topic => `\`${topic}\``).join(' ')}` : ''}
`).join('\n')
  : 'No repositories found'
}

---

*Report generated by GitHub Repo Analyzer CLI on ${new Date().toLocaleString()}*
`;

  return markdown;
}

/**
 * Save data to markdown file
 */
export async function saveToMarkdown(data: RepositoryAnalysis | UserAnalysis, filename: string): Promise<void> {
  try {
    let markdown: string;

    if ('username' in data) {
      // User analysis
      markdown = generateUserMarkdown(data);
    } else {
      // Repository analysis
      markdown = generateRepositoryMarkdown(data);
    }

    const fullPath = path.resolve(filename);

    // Ensure directory exists
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(fullPath, markdown, 'utf8');
    console.log(chalk.green(`✅ Report saved to: ${fullPath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to save markdown file: ${error}`));
    throw error;
  }
}

/**
 * Display repository analysis in console
 */
export function displayRepositoryAnalysis(analysis: RepositoryAnalysis): void {
  console.log(chalk.bold.blue(`\n📁 ${analysis.full_name}`));
  console.log(chalk.dim(analysis.description || 'No description available'));
  console.log(chalk.dim(`🔗 ${analysis.url}`));

  console.log(chalk.yellow('\n📊 Statistics:'));
  console.log(`   ⭐ Stars: ${chalk.bold(analysis.stars.toLocaleString())}`);
  console.log(`   🍴 Forks: ${chalk.bold(analysis.forks.toLocaleString())}`);
  console.log(`   🐛 Open Issues: ${chalk.bold(analysis.open_issues.toLocaleString())}`);
  console.log(`   📦 Size: ${chalk.bold(formatFileSize(analysis.size * 1024))}`);
  console.log(`   📄 License: ${chalk.bold(analysis.license || 'No license')}`);

  console.log(chalk.yellow('\n📅 Dates:'));
  console.log(`   Created: ${chalk.bold(formatDate(analysis.created_at))}`);
  console.log(`   Updated: ${chalk.bold(formatDate(analysis.updated_at))}`);
  console.log(`   Last Commit: ${chalk.bold(formatDate(analysis.last_commit_date))} ${chalk.dim(`(${formatRelativeTime(analysis.last_commit_date)})`)}`);

  if (Object.keys(analysis.languages).length > 0) {
    console.log(chalk.yellow('\n💻 Languages:'));
    Object.entries(analysis.languages)
      .sort(([,a], [,b]) => b - a)
      .forEach(([language, percentage]) => {
        console.log(`   ${language}: ${chalk.bold(`${percentage.toFixed(2)}%`)}`);
      });

    console.log(`\n${generateLanguageBar(analysis.languages)}`);
  }

  if (analysis.topics.length > 0) {
    console.log(chalk.yellow('\n🏷️  Topics:'));
    console.log(`   ${analysis.topics.map(topic => chalk.bgBlue.white(` ${topic} `)).join(' ')}`);
  }
}

/**
 * Display user analysis in console
 */
export function displayUserAnalysis(analysis: UserAnalysis): void {
  console.log(chalk.bold.blue(`\n👤 ${analysis.name || analysis.username}`));
  console.log(chalk.dim(`@${analysis.username}`));
  if (analysis.bio) {
    console.log(chalk.dim(analysis.bio));
  }

  console.log(chalk.yellow('\n📊 GitHub Statistics:'));
  console.log(`   📚 Public Repositories: ${chalk.bold(analysis.public_repos.toLocaleString())}`);
  console.log(`   👥 Followers: ${chalk.bold(analysis.followers.toLocaleString())}`);
  console.log(`   👤 Following: ${chalk.bold(analysis.following.toLocaleString())}`);
  console.log(`   📅 Member Since: ${chalk.bold(formatDate(analysis.created_at))}`);

  if (analysis.location) {
    console.log(`   📍 Location: ${chalk.bold(analysis.location)}`);
  }
  if (analysis.company) {
    console.log(`   🏢 Company: ${chalk.bold(analysis.company)}`);
  }
  if (analysis.blog) {
    console.log(`   🌐 Blog: ${chalk.bold(analysis.blog)}`);
  }

  if (analysis.repositories.length > 0) {
    console.log(chalk.yellow(`\n📁 Top ${analysis.repositories.length} Repositories:`));
    analysis.repositories.forEach((repo, index) => {
      console.log(`\n   ${chalk.bold(`${index + 1}. ${repo.name}`)} ${chalk.dim(`(⭐ ${repo.stars})`)}`);
      if (repo.description) {
        console.log(`   ${chalk.dim(repo.description.substring(0, 80))}${repo.description.length > 80 ? '...' : ''}`);
      }

      const topLanguages = Object.entries(repo.languages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([lang]) => lang);

      if (topLanguages.length > 0) {
        console.log(`   ${chalk.dim('Languages:')} ${topLanguages.join(', ')}`);
      }
    });
  }
}

/**
 * Create filename with timestamp
 */
export function createTimestampedFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Validate and clean filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
