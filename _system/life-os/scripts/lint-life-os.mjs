import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = findRoot(SCRIPT_DIR);

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const issues = [];
  const registry = readRegistry();
  const allMarkdown = collectMarkdownFiles(ROOT_DIR)
    .filter(filePath => !isIgnoredMarkdown(filePath));
  const sourceFiles = allMarkdown
    .filter(filePath => isSlice(filePath) || isRootStory(filePath));
  const validTargets = buildValidTargets(allMarkdown, registry.entities);

  checkRegistryAliases(registry, issues);
  checkSourceFiles(sourceFiles, validTargets, issues);

  printIssues(issues);

  const errors = issues.filter(issue => issue.level === 'error').length;
  const warnings = issues.filter(issue => issue.level === 'warn').length;

  if (errors > 0 || (args.strict && warnings > 0)) {
    process.exitCode = 1;
  }
}

function findRoot(startDir) {
  let current = startDir;

  while (true) {
    if (fs.existsSync(path.join(current, '_system', 'life-os', 'config.json'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Could not find _system/life-os/config.json.');
    }
    current = parent;
  }
}

function parseArgs(argv) {
  return {
    strict: argv.includes('--strict'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

function printHelp() {
  console.log(`Usage:
  node _system/tools/lint-life-os.js
  node _system/tools/lint-life-os.js --strict`);
}

function checkSourceFiles(files, validTargets, issues) {
  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, body, hasFrontmatter } = parseFrontmatter(raw);

    if (!hasFrontmatter) {
      addIssue(issues, 'error', relativePath, 'missing frontmatter');
      continue;
    }

    if (data.at == null) addIssue(issues, 'error', relativePath, 'frontmatter missing at');
    if (data.open == null) addIssue(issues, 'error', relativePath, 'frontmatter missing open');

    if (isSlice(filePath)) {
      const filename = path.basename(filePath);
      if (!/^slice-\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(filename)) {
        addIssue(issues, 'warn', relativePath, 'slice filename should be slice-YYYY-MM-DD-kebab-case.md');
      }
    }

    checkWikilinks(body, relativePath, validTargets, issues);
  }
}

function checkWikilinks(body, relativePath, validTargets, issues) {
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;
  const seenInFile = new Set();
  for (const match of body.matchAll(pattern)) {
    const target = match[1].trim();
    if (!target) continue;
    if (validTargets.has(target)) continue;
    if (seenInFile.has(target)) continue;
    seenInFile.add(target);
    addIssue(issues, 'warn', relativePath, `unresolved wikilink target: ${target}`);
  }
}

function checkRegistryAliases(registry, issues) {
  const seen = new Map();
  for (const entity of registry.entities) {
    const aliases = [entity.id, entity.label, ...entity.aliases];
    for (const alias of aliases) {
      const normalized = normalizeAlias(alias);
      if (!normalized) continue;

      const existing = seen.get(normalized);
      if (existing && existing !== entity.id) {
        addIssue(issues, 'warn', 'entities/registry.yaml', `duplicate alias "${alias}" in ${existing} and ${entity.id}`);
      } else {
        seen.set(normalized, entity.id);
      }
    }
  }
}

function buildValidTargets(markdownFiles, entities) {
  const targets = new Set(entities.map(entity => entity.id));

  for (const filePath of markdownFiles) {
    const basename = path.basename(filePath, '.md');
    targets.add(basename);
  }

  return targets;
}

function printIssues(issues) {
  if (!issues.length) {
    console.log('Life OS lint passed.');
    return;
  }

  const errors = issues.filter(issue => issue.level === 'error');
  const warnings = issues.filter(issue => issue.level === 'warn');

  console.log(`Life OS lint found ${errors.length} error(s), ${warnings.length} warning(s).`);

  for (const issue of issues) {
    console.log(`${issue.level.toUpperCase()} ${issue.file}: ${issue.message}`);
  }
}

function addIssue(issues, level, file, message) {
  issues.push({ level, file, message });
}

function readRegistry() {
  const registryPath = path.join(ROOT_DIR, 'entities', 'registry.yaml');
  if (!fs.existsSync(registryPath)) return { entities: [] };

  const raw = fs.readFileSync(registryPath, 'utf-8');
  const entities = [];
  let current = null;

  for (const line of raw.split('\n')) {
    const idMatch = line.match(/^([a-z0-9][a-z0-9-]*):\s*$/);
    if (idMatch) {
      current = { id: idMatch[1], label: idMatch[1], aliases: [] };
      entities.push(current);
      continue;
    }

    if (!current) continue;

    const labelMatch = line.match(/^\s+label:\s*(.+)$/);
    if (labelMatch) {
      current.label = cleanYamlScalar(labelMatch[1]);
      continue;
    }

    const aliasesMatch = line.match(/^\s+aliases:\s*\[(.*)\]\s*$/);
    if (aliasesMatch) {
      current.aliases = splitInlineArray(aliasesMatch[1]);
    }
  }

  return { entities };
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw, hasFrontmatter: false };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw, hasFrontmatter: false };

  const fm = raw.slice(4, end).trim();
  const body = raw.slice(end + 5);
  const data = {};

  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else data[key] = cleanYamlScalar(value);
  }

  return { data, body, hasFrontmatter: true };
}

function collectMarkdownFiles(dirPath) {
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(fullPath)) continue;
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldSkipDirectory(dirPath) {
  const relativePath = path.relative(ROOT_DIR, dirPath);
  return [
    '.git',
    'node_modules',
    '_system/apps/blog/node_modules',
    '_system/tools/google_workspace_mcp/.venv',
    '_system/runtime',
    'archive/lib/ai-textbook/pdf',
    'archive/lib/physics-textbook/pdf',
  ].some(prefix => relativePath === prefix || relativePath.startsWith(`${prefix}/`));
}

function isIgnoredMarkdown(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  return relativePath.startsWith('stories/posts/');
}

function isSlice(filePath) {
  return path.relative(ROOT_DIR, filePath).startsWith('slices/');
}

function isRootStory(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  if (!relativePath.startsWith('stories/')) return false;
  return !relativePath.startsWith('stories/posts/');
}

function splitInlineArray(value) {
  return value
    .split(',')
    .map(part => cleanYamlScalar(part))
    .filter(Boolean);
}

function cleanYamlScalar(value) {
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

function normalizeAlias(value) {
  return String(value).toLowerCase().normalize('NFKC').trim();
}

main();
