import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = findRoot(SCRIPT_DIR);
const DEFAULT_LIMIT = 12;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const registry = readRegistry();
  const notes = collectSearchableNotes();

  if (args.recent != null) {
    printRecent(notes, args.recent, args.json);
    return;
  }

  const search = buildSearch(args, registry);
  if (!search.terms.length) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const results = notes
    .map(note => scoreNote(note, search))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || compareNotesNewestFirst(a.note, b.note))
    .slice(0, args.limit);

  if (args.json) {
    console.log(JSON.stringify(results.map(formatJsonResult), null, 2));
    return;
  }

  printResults(results, search);
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
    query: [],
    entity: null,
    recent: null,
    limit: DEFAULT_LIMIT,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--entity' && argv[i + 1]) {
      args.entity = argv[i + 1];
      i += 1;
    } else if (arg === '--recent') {
      const next = argv[i + 1];
      args.recent = next && !next.startsWith('--') ? Number(next) || DEFAULT_LIMIT : DEFAULT_LIMIT;
      if (next && !next.startsWith('--')) i += 1;
    } else if (arg === '--limit' && argv[i + 1]) {
      args.limit = Number(argv[i + 1]) || DEFAULT_LIMIT;
      i += 1;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      args.query.push(arg);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node _system/tools/search.js <query>
  node _system/tools/search.js --entity <entity-id-or-alias>
  node _system/tools/search.js --recent 10
  node _system/tools/search.js <query> --limit 20 --json`);
}

function buildSearch(args, registry) {
  if (args.entity) {
    const entity = findEntity(args.entity, registry);
    if (!entity) {
      console.error(`Unknown entity: ${args.entity}`);
      process.exit(1);
    }

    return {
      label: `entity:${entity.id}`,
      entity,
      terms: unique([entity.id, entity.label, ...entity.aliases]).map(normalizeText).filter(Boolean),
    };
  }

  const query = args.query.join(' ').trim();
  return {
    label: query,
    entity: null,
    terms: tokenize(query),
  };
}

function collectSearchableNotes() {
  const spaces = [
    ['slices', path.join(ROOT_DIR, 'slices')],
    ['stories', path.join(ROOT_DIR, 'stories')],
    ['system-docs', path.join(ROOT_DIR, '_system', 'docs')],
  ];

  return spaces.flatMap(([space, dirPath]) => readMarkdownTree(dirPath, space));
}

function readMarkdownTree(dirPath, space) {
  if (!fs.existsSync(dirPath)) return [];

  return collectMarkdownFiles(dirPath).map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    const title = body.match(/^# (.+)$/m)?.[1] || data.title || path.basename(filePath, '.md');

    return {
      id: path.basename(filePath, '.md'),
      relativePath: path.relative(ROOT_DIR, filePath),
      space,
      title: stripMarkdown(title),
      data,
      body,
      raw,
      wikilinks: extractWikilinks(body),
    };
  });
}

function scoreNote(note, search) {
  const title = normalizeText(note.title);
  const subject = normalizeText(note.data.subject || '');
  const at = normalizeText(note.data.at || '');
  const body = normalizeText(note.body);
  const pathText = normalizeText(note.relativePath);
  const wikilinks = note.wikilinks.map(link => normalizeText(link.target));

  let score = 0;
  const matched = new Set();

  for (const term of search.terms) {
    if (!term) continue;
    let termScore = 0;

    if (title.includes(term)) termScore += 8;
    if (subject.includes(term)) termScore += 6;
    if (pathText.includes(term)) termScore += 3;
    if (at.includes(term)) termScore += 2;
    if (wikilinks.some(link => link.includes(term))) termScore += 9;

    const bodyHits = countOccurrences(body, term);
    if (bodyHits > 0) termScore += Math.min(bodyHits, 8);

    if (search.entity && note.wikilinks.some(link => link.target === search.entity.id)) {
      termScore += 12;
    }

    if (termScore > 0) {
      matched.add(term);
      score += termScore;
    }
  }

  return {
    score,
    matched: [...matched],
    snippet: makeSnippet(note.body, search.terms),
    note,
  };
}

function printResults(results, search) {
  console.log(`Search: ${search.label}`);
  if (!results.length) {
    console.log('No matches.');
    return;
  }

  for (const result of results) {
    const at = result.note.data.at ? ` (${result.note.data.at})` : '';
    console.log('');
    console.log(`${result.score.toString().padStart(3, ' ')}  ${result.note.title}${at}`);
    console.log(`     ${result.note.relativePath}`);
    if (result.matched.length) console.log(`     matched: ${result.matched.join(', ')}`);
    if (result.snippet) console.log(`     ${result.snippet}`);
  }
}

function printRecent(notes, limit, json) {
  const results = notes
    .filter(note => note.space === 'slices')
    .sort(compareNotesNewestFirst)
    .slice(0, limit);

  if (json) {
    console.log(JSON.stringify(results.map(note => ({
      title: note.title,
      at: note.data.at || null,
      path: note.relativePath,
    })), null, 2));
    return;
  }

  console.log(`Recent slices (${results.length})`);
  for (const note of results) {
    const at = note.data.at ? ` (${note.data.at})` : '';
    console.log(`- ${note.title}${at} - ${note.relativePath}`);
  }
}

function formatJsonResult(result) {
  return {
    score: result.score,
    matched: result.matched,
    title: result.note.title,
    at: result.note.data.at || null,
    subject: result.note.data.subject || null,
    path: result.note.relativePath,
    snippet: result.snippet,
  };
}

function readRegistry() {
  const registryPath = path.join(ROOT_DIR, 'entities', 'registry.yaml');
  if (!fs.existsSync(registryPath)) return [];

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

  return entities;
}

function findEntity(input, registry) {
  const normalized = normalizeText(input);
  return registry.find(entity => {
    if (normalizeText(entity.id) === normalized) return true;
    if (normalizeText(entity.label) === normalized) return true;
    return entity.aliases.some(alias => normalizeText(alias) === normalized);
  });
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
    else data[key] = cleanYamlScalar(value);
  }

  return { data, body };
}

function extractWikilinks(body) {
  const links = [];
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;
  for (const match of body.matchAll(pattern)) {
    links.push({
      target: match[1].trim(),
      label: (match[2] || match[1]).trim(),
    });
  }
  return links;
}

function makeSnippet(body, terms) {
  const normalizedTerms = terms.map(normalizeText).filter(Boolean);
  for (const line of body.split('\n')) {
    const clean = stripMarkdown(line);
    if (!clean || clean.startsWith('#')) continue;
    const normalized = normalizeText(clean);
    if (normalizedTerms.some(term => normalized.includes(term))) {
      return clean.length > 140 ? `${clean.slice(0, 137)}...` : clean;
    }
  }
  return '';
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

function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const words = normalized.split(/\s+/).filter(Boolean);
  return unique([normalized, ...words]).filter(term => term.length >= 2);
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[_/]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdown(text) {
  return String(text)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[*_`~>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countOccurrences(text, term) {
  if (!text || !term) return 0;
  let count = 0;
  let idx = 0;
  while (idx !== -1) {
    idx = text.indexOf(term, idx);
    if (idx !== -1) {
      count += 1;
      idx += term.length;
    }
  }
  return count;
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

main();
