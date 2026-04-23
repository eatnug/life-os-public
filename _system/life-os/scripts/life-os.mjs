import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const rootDir = findRoot(SCRIPT_DIR);
  const configPath = path.join(rootDir, '_system', 'life-os', 'config.json');
  const config = readConfig(configPath);

  if (command === 'config') {
    console.log(JSON.stringify({ path: path.relative(rootDir, configPath), config }, null, 2));
    return;
  }

  if (command === 'check') {
    runConfigured(rootDir, config, 'lint', []);
    runConfigured(rootDir, config, 'session', ['list']);
    return;
  }

  runConfigured(rootDir, config, command, args);
}

function printHelp() {
  console.log(`Usage:
  node _system/life-os/scripts/life-os.mjs briefing [args]
  node _system/life-os/scripts/life-os.mjs search <query>
  node _system/life-os/scripts/life-os.mjs search --entity <entity-id-or-alias>
  node _system/life-os/scripts/life-os.mjs lint [args]
  node _system/life-os/scripts/life-os.mjs session <command>
  node _system/life-os/scripts/life-os.mjs check
  node _system/life-os/scripts/life-os.mjs config`);
}

function findRoot(startDir) {
  let current = startDir;

  while (true) {
    if (fs.existsSync(path.join(current, '_system', 'life-os', 'config.json'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Could not find _system/life-os/config.json from runtime script path.');
    }
    current = parent;
  }
}

function readConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing config: ${configPath}`);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function runConfigured(rootDir, config, commandName, args) {
  const configured = config.commands?.[commandName];
  if (!configured) {
    console.error(`Unknown Life OS command: ${commandName}`);
    process.exitCode = 1;
    return;
  }

  const [bin, ...baseArgs] = configured;
  const result = spawnSync(bin, [...baseArgs, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exitCode = 1;
    return;
  }

  process.exitCode = result.status ?? 0;
}

main();
