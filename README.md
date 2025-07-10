# 🔍 GitHub Repo Analyzer CLI

A powerful, feature-rich command-line tool built with Node.js and TypeScript to analyze GitHub repositories and users. Get comprehensive insights including repository statistics, language breakdowns, commit activity, and detailed user profiles.

## ✨ Features

- **📁 Repository Analysis**: Detailed stats including stars, forks, issues, languages, and commit history
- **👤 User Analysis**: Comprehensive user profiles with top repositories and statistics  
- **🤖 Auto-Detection**: Automatically detects whether input is a repository URL or username
- **🎨 Beautiful Output**: Colorful, formatted console output with progress indicators
- **💾 Export Options**: Save results as JSON or Markdown reports
- **⚡ Fast & Efficient**: Concurrent API calls and smart caching
- **🔐 Token Support**: GitHub personal access token support for higher rate limits
- **📊 Rate Limit Monitoring**: Built-in rate limit checking and warnings

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)

### Installation

1. **Extract the project** from the ZIP file
2. **Navigate to project directory**:
   ```bash
   cd github-repo-analyzer
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **(Optional) Set up GitHub token** for higher rate limits:
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your GitHub token
   # Get a token from: https://github.com/settings/tokens
   ```

### Usage

#### 📁 Analyze a Repository

```bash
# Using owner/repo format
npm start repo facebook/react

# Using full GitHub URL
npm start repo https://github.com/microsoft/vscode

# Save as JSON report
npm start repo facebook/react --output json --save react-analysis.json

# Save as Markdown report  
npm start repo facebook/react --output md --save react-report.md
```

#### 👤 Analyze a User

```bash
# Analyze user with default settings (top 10 repos)
npm start user octocat

# Analyze user with custom repo limit
npm start user torvalds --repos 5

# Save user analysis as Markdown
npm start user octocat --output md --save octocat-profile.md
```

#### 🤖 Auto-Detection

```bash
# Automatically detect if input is a repo or user
npm start analyze facebook/react
npm start analyze octocat
npm start analyze https://github.com/microsoft/typescript
```

#### 📊 Check Rate Limits

```bash
# Check your current GitHub API rate limit status
npm start rate-limit --token your_github_token
```

## 🛠️ Development

### Project Structure

```
github-repo-analyzer/
├── src/
│   ├── index.ts          # CLI entry point with Commander.js
│   ├── api.ts            # GitHub API client with Axios
│   └── utils.ts          # Utility functions and formatters
├── types/
│   └── index.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
└── README.md            # This file
```

### Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run in development mode with ts-node
npm run dev

# Build and run
npm run build:start

# Run the compiled version
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# GitHub Personal Access Token (optional but recommended)
# Get one from: https://github.com/settings/tokens
# Scopes needed: public_repo (or repo for private repos)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### GitHub Token Setup

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "GitHub Repo Analyzer CLI"
4. Select scopes:
   - `public_repo` (for public repositories)
   - `repo` (if you need access to private repositories)
5. Copy the generated token and add it to your `.env` file

**Benefits of using a token:**
- Higher rate limits (5,000 requests/hour vs 60 requests/hour)
- Access to private repositories (if token has appropriate scopes)
- More detailed repository information

## 📖 API Reference

### Repository Analysis Output

```typescript
interface RepositoryAnalysis {
  name: string;              // Repository name
  full_name: string;         // Full name (owner/repo)
  description: string;       // Repository description
  url: string;              // GitHub URL
  stars: number;            // Star count
  forks: number;            // Fork count
  open_issues: number;      // Open issues count
  last_commit_date: string; // Last commit timestamp
  languages: {              // Language breakdown (percentages)
    [language: string]: number;
  };
  created_at: string;       // Creation date
  updated_at: string;       // Last update date
  license: string;          // License name
  topics: string[];         // Repository topics
  size: number;             // Repository size in KB
  default_branch: string;   // Default branch name
}
```

### User Analysis Output

```typescript
interface UserAnalysis {
  username: string;         // GitHub username
  name: string;            // Display name
  bio: string;             // User bio
  location: string;        // Location
  email: string;           // Public email
  blog: string;            // Blog/website URL
  company: string;         // Company
  public_repos: number;    // Public repository count
  followers: number;       // Follower count
  following: number;       // Following count
  created_at: string;      // Account creation date
  repositories: RepositoryAnalysis[]; // Top repositories
}
```

## 🎨 Output Examples

### Console Output

The tool provides beautiful, colorful console output with:
- 🎯 **Progress indicators** with Ora spinners
- 🌈 **Color-coded information** using Chalk
- 📊 **Visual language breakdown** with progress bars
- 📈 **Formatted statistics** and dates
- 🏷️ **Highlighted topics and tags**

### JSON Export

```json
{
  "name": "react",
  "full_name": "facebook/react",
  "description": "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
  "url": "https://github.com/facebook/react",
  "stars": 219000,
  "forks": 45000,
  "open_issues": 800,
  "languages": {
    "JavaScript": 93.2,
    "TypeScript": 4.1,
    "HTML": 2.7
  }
}
```

### Markdown Export

```markdown
# react

## Repository Information
- **Full Name**: facebook/react
- **Description**: A declarative, efficient, and flexible JavaScript library...
- **URL**: [https://github.com/facebook/react](https://github.com/facebook/react)

## Repository Statistics
| Metric | Value |
|--------|--------|
| ⭐ Stars | 219,000 |
| 🍴 Forks | 45,000 |
| 🐛 Open Issues | 800 |
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **GitHub API** for providing comprehensive repository and user data
- **Commander.js** for excellent CLI framework
- **Chalk** for beautiful terminal colors
- **Ora** for elegant loading spinners
- **Axios** for reliable HTTP requests
- **TypeScript** for type safety and better development experience

## 📞 Support

If you encounter any issues:

1. Make sure you have Node.js v16+ installed
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile TypeScript
4. Check that your GitHub token (if using) has correct permissions

## 🔗 Links

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Creating GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Rate Limits](https://docs.github.com/en/rest/overview/rate-limits)

---

**Made with ❤️ using Node.js, TypeScript, and the GitHub API**
# GitHub-Repo-Analyzer-CLI-tool
