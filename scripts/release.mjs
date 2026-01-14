import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    stdio: options.stdio ?? 'pipe',
    encoding: 'utf8',
    ...options,
  });

  if (typeof output !== 'string') return '';
  return output.trim();
}

function die(message) {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = [];
  const flags = new Set();
  const kv = new Map();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      args.push(arg);
      continue;
    }

    const eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      kv.set(arg.slice(2, eqIndex), arg.slice(eqIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      kv.set(key, next);
      i++;
      continue;
    }

    flags.add(key);
  }

  return { args, flags, kv };
}

function readVersion() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.version;
}

const { args, flags, kv } = parseArgs(process.argv.slice(2));

const bump = args[0];
const dryRun = flags.has('dry-run');
const skipLint = flags.has('skip-lint');
const allowDirty = flags.has('allow-dirty');
const remote = kv.get('remote') ?? 'origin';
const branch = kv.get('branch') ?? 'main';
const cacheDir = kv.get('cache') ?? path.join(os.tmpdir(), 'npm-cache-linode-mcp-server');

if (!bump || !['patch', 'minor', 'major'].includes(bump)) {
  die(
    [
      'Usage: node scripts/release.mjs <patch|minor|major> [--dry-run] [--skip-lint]',
      '       [--allow-dirty] (only useful with --dry-run)',
      '       [--remote origin] [--branch main] [--cache /path/to/npm-cache]',
    ].join('\n')
  );
}

const currentBranch = run('git', ['branch', '--show-current']);
if (currentBranch !== branch) {
  die(`Refusing to release from branch "${currentBranch}". Switch to "${branch}" and try again.`);
}

const porcelain = run('git', ['status', '--porcelain=v1']);
if (porcelain.length > 0 && !(dryRun && allowDirty)) {
  die('Working tree is dirty. Commit or stash changes before releasing.');
}

// Ensure we're releasing from the latest remote commit.
run('git', ['fetch', remote, branch, '--tags', '--prune'], { stdio: 'inherit' });
const behindCountRaw = run('git', ['rev-list', '--count', `HEAD..${remote}/${branch}`]);
const behindCount = Number.parseInt(behindCountRaw, 10);
if (Number.isNaN(behindCount)) {
  die(`Unable to determine if branch is behind ${remote}/${branch}. Got: "${behindCountRaw}"`);
}

if (behindCount > 0 && porcelain.length > 0 && dryRun && allowDirty) {
  // eslint-disable-next-line no-console
  console.log(
    `Dirty working tree: skipping fast-forward merge (behind ${remote}/${branch} by ${behindCount} commits).`
  );
} else if (behindCount > 0) {
  run('git', ['merge', '--ff-only', `${remote}/${branch}`], { stdio: 'inherit' });
}

if (!skipLint) {
  run('npm', ['run', 'lint'], { stdio: 'inherit' });
}
run('npm', ['run', 'build'], { stdio: 'inherit' });

if (dryRun) {
  // eslint-disable-next-line no-console
  console.log('Dry run: skipping version bump, publish, and push.');
  process.exit(0);
}

run('npm', ['version', bump], { stdio: 'inherit' });
const version = readVersion();
const tag = `v${version}`;

run('npm', ['publish', '--cache', cacheDir], { stdio: 'inherit' });
run('git', ['push', remote, branch], { stdio: 'inherit' });
run('git', ['push', remote, tag], { stdio: 'inherit' });

// eslint-disable-next-line no-console
console.log(`Released ${tag}.`);
