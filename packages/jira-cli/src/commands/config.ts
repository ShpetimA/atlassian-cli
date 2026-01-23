import { Command } from "commander";
import { loadConfig, saveConfig, initConfig } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createConfigCommand(): Command {
  const config = new Command("config").description("Manage CLI configuration");

  config
    .command("init")
    .description("Initialize config file with default profile")
    .option("--domain <domain>", "Jira domain (e.g., mycompany)")
    .option("--email <email>", "Account email")
    .option("--token <token>", "API token")
    .action(async (options) => {
      let cfg = loadConfig();
      if (!cfg) {
        cfg = initConfig();
      }

      if (options.domain && options.email && options.token) {
        cfg.profiles["default"] = {
          domain: options.domain,
          email: options.email,
          apiToken: options.token,
        };
        saveConfig(cfg);
        output({ success: true, message: "Config initialized with default profile" }, "json");
      } else {
        saveConfig(cfg);
        output({
          success: true,
          message: "Config file created. Add credentials with 'jc config set' or env vars",
        }, "json");
      }
    });

  config
    .command("set <key> <value>")
    .description("Set a config value (e.g., defaults.project, profiles.default.domain)")
    .action(async (key, value) => {
      let cfg = loadConfig();
      if (!cfg) {
        cfg = initConfig();
      }

      const parts = key.split(".");
      let obj: any = cfg;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in obj)) {
          obj[parts[i]] = {};
        }
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;

      saveConfig(cfg);
      output({ success: true, key, value }, "json");
    });

  config
    .command("get <key>")
    .description("Get a config value")
    .action(async (key) => {
      const cfg = loadConfig();
      if (!cfg) {
        throw new Error("No config file. Run 'jc config init' first");
      }

      const parts = key.split(".");
      let value: any = cfg;
      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }

      output({ key, value }, "json");
    });

  config
    .command("list")
    .description("Show current configuration")
    .option("--format <format>", "Output format: json|plain|minimal", "json")
    .action(async (options) => {
      const cfg = loadConfig();
      if (!cfg) {
        throw new Error("No config file. Run 'jc config init' first");
      }

      // Mask API tokens
      const masked = JSON.parse(JSON.stringify(cfg));
      for (const profile of Object.values(masked.profiles) as any[]) {
        if (profile.apiToken) {
          profile.apiToken = profile.apiToken.slice(0, 8) + "...";
        }
      }

      output(masked, options.format as OutputFormat);
    });

  config
    .command("profile <name>")
    .description("Switch active profile")
    .action(async (name) => {
      const cfg = loadConfig();
      if (!cfg) {
        throw new Error("No config file. Run 'jc config init' first");
      }

      if (!(name in cfg.profiles)) {
        throw new Error(`Profile not found: ${name}. Available: ${Object.keys(cfg.profiles).join(", ")}`);
      }

      cfg.defaults.profile = name;
      saveConfig(cfg);
      output({ success: true, message: `Switched to profile: ${name}` }, "json");
    });

  return config;
}
