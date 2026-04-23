import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = findRoot(SCRIPT_DIR);
const RUNTIME_DIR = path.join(ROOT_DIR, '_system', 'runtime');
const SESSION_FILE = path.join(RUNTIME_DIR, 'session.json');

function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'init') return initSession();
  if (command === 'list') return listSession();
  if (command === 'add') return addCandidate(rest);
  if (command === 'set') return setCandidate(rest);
  if (command === 'clear') return clearSession();

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = 1;
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

function printHelp() {
  console.log(`Usage:
  node _system/tools/session.js init
  node _system/tools/session.js list
  node _system/tools/session.js add <subject> [--status candidate|written|pending-permission|uncaptured] [--file path] [--note text]
  node _system/tools/session.js set <subject> [--status candidate|written|pending-permission|uncaptured] [--file path] [--note text]
  node _system/tools/session.js clear`);
}

function initSession() {
  const session = {
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    slice_candidates: [],
  };
  writeSession(session);
  console.log(`Initialized ${path.relative(ROOT_DIR, SESSION_FILE)}`);
}

function listSession() {
  const session = readSession();
  if (!session.slice_candidates.length) {
    console.log('No session slice candidates.');
    return;
  }

  console.log(`Session started: ${session.started_at}`);
  for (const item of session.slice_candidates) {
    const file = item.file ? ` file=${item.file}` : '';
    const note = item.note ? ` note=${item.note}` : '';
    console.log(`- ${item.subject} status=${item.status}${file}${note}`);
  }
}

function addCandidate(argv) {
  const { subject, options } = parseSubjectAndOptions(argv);
  if (!subject) {
    console.error('Missing subject.');
    process.exitCode = 1;
    return;
  }

  const session = readSession();
  if (session.slice_candidates.some(item => item.subject === subject)) {
    console.error(`Candidate already exists: ${subject}`);
    process.exitCode = 1;
    return;
  }

  session.slice_candidates.push({
    subject,
    status: options.status || 'candidate',
    file: options.file || null,
    note: options.note || null,
  });
  session.updated_at = new Date().toISOString();
  writeSession(session);
  console.log(`Added ${subject}`);
}

function setCandidate(argv) {
  const { subject, options } = parseSubjectAndOptions(argv);
  if (!subject) {
    console.error('Missing subject.');
    process.exitCode = 1;
    return;
  }

  const session = readSession();
  let item = session.slice_candidates.find(candidate => candidate.subject === subject);
  if (!item) {
    item = { subject, status: 'candidate', file: null, note: null };
    session.slice_candidates.push(item);
  }

  if (options.status) item.status = options.status;
  if (options.file !== undefined) item.file = options.file;
  if (options.note !== undefined) item.note = options.note;

  session.updated_at = new Date().toISOString();
  writeSession(session);
  console.log(`Updated ${subject}`);
}

function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.rmSync(SESSION_FILE);
    console.log(`Removed ${path.relative(ROOT_DIR, SESSION_FILE)}`);
  } else {
    console.log('No session file to remove.');
  }
}

function parseSubjectAndOptions(argv) {
  const subjectParts = [];
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--status' && argv[i + 1]) {
      options.status = argv[i + 1];
      i += 1;
    } else if (arg === '--file' && argv[i + 1]) {
      options.file = argv[i + 1];
      i += 1;
    } else if (arg === '--note' && argv[i + 1]) {
      options.note = argv[i + 1];
      i += 1;
    } else {
      subjectParts.push(arg);
    }
  }

  const subject = subjectParts.join(' ').trim();
  return { subject, options };
}

function readSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    return {
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slice_candidates: [],
    };
  }

  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
}

function writeSession(session) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(SESSION_FILE, `${JSON.stringify(session, null, 2)}\n`);
}

main();
