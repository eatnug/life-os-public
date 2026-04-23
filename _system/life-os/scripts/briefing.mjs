import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = findRoot(SCRIPT_DIR);
const TODAY = getDateInTimeZone(new Date(), 'Asia/Seoul');
const DEFAULT_RECENT_LIMIT = 8;

function main() {
  const args = parseArgs(process.argv.slice(2));
  const briefing = buildBriefing(args);

  if (args.json) {
    console.log(JSON.stringify(briefing, null, 2));
    return;
  }

  printBriefing(briefing);
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
  const args = {
    json: false,
    full: false,
    recentLimit: DEFAULT_RECENT_LIMIT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--full') args.full = true;
    else if (arg === '--recent' && argv[i + 1]) {
      args.recentLimit = Number(argv[i + 1]) || DEFAULT_RECENT_LIMIT;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node _system/life-os/scripts/life-os.mjs briefing
  node _system/life-os/scripts/life-os.mjs briefing --recent 12
  node _system/life-os/scripts/life-os.mjs briefing --full
  node _system/life-os/scripts/life-os.mjs briefing --json`);
}

function buildBriefing(args) {
  const config = readConfig();
  const slices = readMarkdownTree(path.join(ROOT_DIR, 'slices'), 'slices')
    .filter(note => note.data.open !== false);
  const stories = readMarkdownTree(path.join(ROOT_DIR, 'stories'), 'stories')
    .filter(note => note.data.open !== false);
  const registry = readRegistry();
  const viewWorkflows = readViewWorkflows(config);
  const startupViews = selectLifecycleViews(viewWorkflows, config.startup?.lifecycleEvent || 'session_start');

  const recentSlices = [...slices]
    .sort(compareNotesNewestFirst)
    .slice(0, args.full ? slices.length : args.recentLimit);

  return {
    today: TODAY,
    counts: {
      openSlices: slices.length,
      openStories: stories.filter(note => !note.relativePath.startsWith('stories/posts/')).length,
      entities: registry.size,
    },
    startup: {
      lifecycleEvent: config.startup?.lifecycleEvent || 'session_start',
      systemDocs: config.startup?.systemDocs || [],
    },
    startupViews,
    recentSlices: recentSlices.map(noteSummary),
    agentCommands: [
      'node _system/life-os/scripts/life-os.mjs search <query>',
      'node _system/life-os/scripts/life-os.mjs search --entity <entity-id-or-alias>',
      'node _system/life-os/scripts/life-os.mjs search --recent 10',
      'node _system/life-os/scripts/life-os.mjs lint',
      'node _system/life-os/scripts/life-os.mjs session list',
    ],
  };
}

function noteSummary(note) {
  return {
    title: note.title,
    at: note.data.at || null,
    subject: note.data.subject || null,
    path: note.relativePath,
  };
}

function printBriefing(briefing) {
  console.log(`Life OS startup briefing - ${briefing.today}`);
  console.log('');
  console.log(`Open source memory: ${briefing.counts.openSlices} slices, ${briefing.counts.openStories} stories, ${briefing.counts.entities} entities`);

  printViewSection('Startup view workflows', briefing.startupViews);
  printPathSection('Startup system docs', briefing.startup.systemDocs);
  printNoteSection('Recent slices', briefing.recentSlices);

  console.log('');
  console.log('Agent-internal commands');
  for (const command of briefing.agentCommands) {
    console.log(`- ${command}`);
  }
}

function printSection(title, items) {
  console.log('');
  console.log(title);
  if (!items.length) {
    console.log('- none');
    return;
  }

  for (const item of items) {
    const status = item.done ? '[x]' : '[ ]';
    console.log(`- ${status} ${item.text}`);
  }
}

function printNoteSection(title, notes) {
  console.log('');
  console.log(title);
  if (!notes.length) {
    console.log('- none');
    return;
  }

  for (const note of notes) {
    const at = note.at ? ` (${note.at})` : '';
    console.log(`- ${note.title}${at} - ${note.path}`);
  }
}

function readMarkdownTree(dirPath, space) {
  if (!fs.existsSync(dirPath)) return [];

  return collectMarkdownFiles(dirPath).map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    const title = body.match(/^# (.+)$/m)?.[1] || data.title || path.basename(filePath, '.md');
    return {
      id: path.basename(filePath, '.md'),
      absolutePath: filePath,
      relativePath: path.relative(ROOT_DIR, filePath),
      space,
      title: stripMarkdown(title),
      data,
      body,
    };
  });
}

function printPathSection(title, paths) {
  console.log('');
  console.log(title);
  if (!paths.length) {
    console.log('- none');
    return;
  }

  for (const value of paths) {
    console.log(`- ${value}`);
  }
}

function printViewSection(title, views) {
  console.log('');
  console.log(title);
  if (!views.length) {
    console.log('- none');
    return;
  }

  for (const view of views) {
    const actions = view.actions.map(action => action.do).join(', ');
    const suffix = actions ? ` [${actions}]` : '';
    console.log(`- ${view.label} - ${view.path}${suffix}`);
  }
}

function collectMarkdownFiles(dirPath) {
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...collectMarkdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

function readRegistry() {
  const registryPath = path.join(ROOT_DIR, 'entities', 'registry.yaml');
  const ids = new Set();
  if (!fs.existsSync(registryPath)) return ids;

  const raw = fs.readFileSync(registryPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^([a-z0-9][a-z0-9-]*):\s*$/);
    if (match) ids.add(match[1]);
  }

  return ids;
}

function readConfig() {
  const configPath = path.join(ROOT_DIR, '_system', 'life-os', 'config.json');
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function readViewWorkflows(config) {
  const configuredPath = config.paths?.viewWorkflows || '_system/life-os/view-workflows.json';
  const workflowPath = path.join(ROOT_DIR, configuredPath);
  if (!fs.existsSync(workflowPath)) return [];

  const raw = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
  return Array.isArray(raw.views) ? raw.views : [];
}

function selectLifecycleViews(viewWorkflows, eventName) {
  return viewWorkflows
    .map(view => ({
      id: view.id,
      label: view.label || view.id,
      path: view.path,
      purpose: view.purpose || '',
      actions: Array.isArray(view.lifecycle)
        ? view.lifecycle.filter(item => item.on === eventName)
        : [],
    }))
    .filter(view => view.actions.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };

  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw };

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
    else data[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return { data, body };
}

function compareNotesNewestFirst(a, b) {
  return compareAtDescending(a, b) || b.relativePath.localeCompare(a.relativePath);
}

function compareAtDescending(a, b) {
  return atRank(b.data.at) - atRank(a.data.at);
}

function atRank(value) {
  const text = String(value || '');
  const date = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!date) return 0;

  const [, year, month, day, hour = '00', minute = '00'] = date;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function stripMarkdown(text) {
  return String(text)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

main();
