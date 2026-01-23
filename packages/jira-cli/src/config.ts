import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { ConfigFile, ConfigProfile, JiraConfig, OutputFormat } from "./types/jira.js";

function getConfigPath(): string {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(process.env.APPDATA || "", "jc", "config.json");
  }
  return path.join(os.homedir(), ".config", "jc", "config.json");
}

export function loadConfig(): ConfigFile | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(content) as ConfigFile;
}

export function saveConfig(config: ConfigFile): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function initConfig(): ConfigFile {
  const config: ConfigFile = {
    profiles: {},
    defaults: {
      profile: "default",
      format: "json",
    },
  };
  saveConfig(config);
  return config;
}

export function getActiveProfile(config: ConfigFile, profileName?: string): ConfigProfile | null {
  const name = profileName || config.defaults.profile;
  return config.profiles[name] || null;
}

export function resolveJiraConfig(options: {
  domain?: string;
  email?: string;
  token?: string;
  profile?: string;
}): JiraConfig {
  // 1. CLI flags
  if (options.domain && options.email && options.token) {
    return {
      domain: options.domain,
      email: options.email,
      apiToken: options.token,
    };
  }

  // 2. Environment variables
  const envDomain = process.env.JIRA_DOMAIN;
  const envEmail = process.env.JIRA_EMAIL;
  const envToken = process.env.JIRA_API_TOKEN;

  if (envDomain && envEmail && envToken) {
    return {
      domain: envDomain,
      email: envEmail,
      apiToken: envToken,
    };
  }

  // 3. Config file
  const config = loadConfig();
  if (config) {
    const profile = getActiveProfile(config, options.profile);
    if (profile) {
      return {
        domain: options.domain || envDomain || profile.domain,
        email: options.email || envEmail || profile.email,
        apiToken: options.token || envToken || profile.apiToken,
      };
    }
  }

  throw new Error(
    "Missing Jira credentials. Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN env vars or run 'jc config init'"
  );
}

export function getDefaultProject(): string | undefined {
  const envProject = process.env.JIRA_PROJECT;
  if (envProject) return envProject;

  const config = loadConfig();
  return config?.defaults.project;
}

export function getDefaultFormat(): OutputFormat {
  const config = loadConfig();
  return config?.defaults.format || "json";
}
