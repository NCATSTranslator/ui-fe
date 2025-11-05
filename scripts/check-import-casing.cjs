#!/usr/bin/env node
// Case-only import checker (relative + TS alias) for JS/TS/TSX/JSX.
// Reports only letter-case differences; preserves original import shape.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INPUT_PATHS = process.argv.slice(2).length ? process.argv.slice(2) : ['src'];

const SRC_EXTS = ['.ts', '.tsx', '.js', '.jsx'];
const RESOLVE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.d.ts', '.mts', '.cts', '.cjs', '.mjs', '.json', '.svg'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache']);
const IMPORT_REGEXES = [
  /\bimport\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"]*\s+from\s+['"]([^'"]+)['"]/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

// --- tsconfig loader (no TS dependency needed) ---
function loadTsConfig() {
  const tryPaths = [path.join(ROOT, 'tsconfig.json'), path.join(ROOT, 'jsconfig.json')];
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        const co = raw.compilerOptions || {};
        const baseUrl = co.baseUrl ? path.resolve(ROOT, co.baseUrl) : ROOT;
        const paths = co.paths || {};
        return { baseUrl, paths };
      } catch { /* ignore */ }
    }
  }
  return { baseUrl: ROOT, paths: {} };
}

const tsconf = loadTsConfig();

// --- utilities ---
function* walkFiles(startPath) {
  const abs = path.resolve(ROOT, startPath);
  if (!fs.existsSync(abs)) return;

  const st = fs.statSync(abs);
  if (st.isFile()) {
    if (SRC_EXTS.includes(path.extname(abs))) yield abs;
    return;
  }
  const stack = [abs];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (IGNORE_DIRS.has(ent.name)) continue;
        stack.push(path.join(dir, ent.name));
      } else if (ent.isFile()) {
        if (SRC_EXTS.includes(path.extname(ent.name))) yield path.join(dir, ent.name);
      }
    }
  }
}

function extractSpecs(code) {
  const specs = [];
  for (const rx of IMPORT_REGEXES) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(code))) specs.push({ spec: m[1], index: m.index });
  }
  return specs;
}

// strip ?query and #fragment for resolution (keeps original for display)
function stripQueryFragment(s) {
  const q = s.indexOf('?'); const h = s.indexOf('#');
  const cut = Math.min(q === -1 ? s.length : q, h === -1 ? s.length : h);
  return s.slice(0, cut);
}

function lookupEntryCase(dir, providedName) {
  let list;
  try { list = fs.readdirSync(dir); } catch { return { exists: false, correct: null }; }
  const lower = providedName.toLowerCase();
  for (const entry of list) {
    if (entry.toLowerCase() === lower) return { exists: true, correct: entry };
  }
  return { exists: false, correct: null };
}

function resolveUnderBaseCaseAware(baseDir, rawSubPath) {
  const parts = rawSubPath.split('/');
  let curr = baseDir;
  const corrected = [];

  // directories except last
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (seg === '.' || seg === '') { corrected.push(seg); continue; }
    if (seg === '..') { curr = path.dirname(curr); corrected.push(seg); continue; }
    const { exists, correct } = lookupEntryCase(curr, seg);
    if (!exists) return null;
    corrected.push(correct);
    curr = path.join(curr, correct);
    if (!fs.existsSync(curr) || !fs.statSync(curr).isDirectory()) return null;
  }

  // last segment
  const last = parts[parts.length - 1];
  if (last === '.' || last === '' || last === '..') return null;

  const lastHasExt = path.extname(last) !== '';
  let correctedLast = last;
  let resolvedFile = null;

  if (lastHasExt) {
    const { exists, correct } = lookupEntryCase(curr, last);
    if (!exists) return null;
    correctedLast = correct;
    const p = path.join(curr, correct);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) resolvedFile = p; else return null;
  } else {
    // try as file without extension
    let fileFound = false;
    for (const ext of RESOLVE_EXTS) {
      const nameWithExt = last + ext;
      const { exists, correct } = lookupEntryCase(curr, nameWithExt);
      if (exists) {
        const p = path.join(curr, correct);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          correctedLast = correct.replace(/\.[^.]+$/, ''); // keep extensionless style
          resolvedFile = p;
          fileFound = true;
          break;
        }
      }
    }
    // or as directory with index.*
    if (!fileFound) {
      const { exists, correct } = lookupEntryCase(curr, last);
      if (!exists) return null;
      const dirPath = path.join(curr, correct);
      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return null;
      let indexResolved = null;
      for (const ext of RESOLVE_EXTS) {
        const idx = path.join(dirPath, 'index' + ext);
        if (fs.existsSync(idx) && fs.statSync(idx).isFile()) { indexResolved = idx; break; }
      }
      if (!indexResolved) return null;
      correctedLast = correct; // folder-style import
      resolvedFile = indexResolved;
    }
  }

  corrected.push(correctedLast);
  return { resolvedFile, correctedSubPath: corrected.join('/') };
}

// relative resolver
function resolveRelativeImportCaseAware(fromFile, rawImport) {
  const baseDir = path.dirname(fromFile);
  return resolveUnderBaseCaseAware(baseDir, rawImport);
}

// alias matching: supports patterns WITH or WITHOUT '*'
function matchAlias(spec, tsconf) {
  const patterns = tsconf.paths || {};
  for (const pat of Object.keys(patterns)) {
    const targets = Array.isArray(patterns[pat]) ? patterns[pat] : [patterns[pat]];
    const starIdx = pat.indexOf('*');

    if (starIdx === -1) {
      // exact key (e.g. "@ui") or prefix (treat as exact)
      if (spec === pat || spec.startsWith(pat + '/')) {
        const sub = spec.slice(pat.length).replace(/^\//, ''); // remainder under alias root
        const target = targets[0];
        const tgtStar = target.indexOf('*');
        let base = target, suffix = '';
        if (tgtStar !== -1) { base = target.slice(0, tgtStar); suffix = target.slice(tgtStar + 1); }
        const baseDir = path.resolve(tsconf.baseUrl || ROOT, base);
        return { aliasPrefix: pat, subpath: (sub ? sub : '') + suffix, baseDir, postSuffixInTarget: suffix };
      }
    } else {
      // pattern with '*'
      const pre = pat.slice(0, starIdx);
      const post = pat.slice(starIdx + 1);
      if (!(spec.startsWith(pre) && spec.endsWith(post))) continue;
      const mid = spec.slice(pre.length, spec.length - post.length);
      const target = targets[0];
      const tgtStar = target.indexOf('*');
      let base = target, suffix = '';
      if (tgtStar !== -1) { base = target.slice(0, tgtStar); suffix = target.slice(tgtStar + 1); }
      const baseDir = path.resolve(tsconf.baseUrl || ROOT, base);
      return { aliasPrefix: pre, subpath: mid + suffix, baseDir, postSuffixInTarget: suffix };
    }
  }
  return null;
}

function resolveAliasedImportCaseAware(spec) {
  const m = matchAlias(spec, tsconf);
  if (!m) return null;
  const res = resolveUnderBaseCaseAware(m.baseDir, m.subpath);
  if (!res) return null;

  // preserve author's alias prefix & overall style; strip target suffix if author didn't write it
  const authorTail = spec.slice(m.aliasPrefix.length);
  let correctedSub = res.correctedSubPath;
  if (m.postSuffixInTarget && !authorTail.endsWith(m.postSuffixInTarget)) {
    if (correctedSub.endsWith(m.postSuffixInTarget)) {
      correctedSub = correctedSub.slice(0, -m.postSuffixInTarget.length);
    }
  }
  const suggested = m.aliasPrefix + correctedSub;
  return { suggestedImport: suggested, resolvedFile: res.resolvedFile };
}

function main() {
  const results = [];
  let filesScanned = 0;
  let importsSeen = 0;
  let importsResolvedAndChecked = 0;

  for (const start of INPUT_PATHS) {
    for (const file of walkFiles(start)) {
      filesScanned++;
      let code = '';
      try { code = fs.readFileSync(file, 'utf8'); } catch { continue; }

      // line index for locations
      const lineStarts = [0];
      for (let i = 0; i < code.length; i++) if (code[i] === '\n') lineStarts.push(i + 1);
      const getLineCol = (idx) => {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo <= hi) { const mid = (lo + hi) >> 1; if (lineStarts[mid] <= idx) lo = mid + 1; else hi = mid - 1; }
        const line = hi, col = idx - lineStarts[line];
        return { line: line + 1, col: col + 1 };
      };

      const specs = extractSpecs(code);
      for (const { spec, index } of specs) {
        importsSeen++;
        const raw = spec;
        const clean = stripQueryFragment(raw);

        if (clean.startsWith('./') || clean.startsWith('../')) {
          const info = resolveRelativeImportCaseAware(file, clean);
          if (!info) continue;
          importsResolvedAndChecked++;
          const suggested = info.correctedSubPath;
          const orig = clean.replace(/\\/g, '/');
          const sugg = suggested.replace(/\\/g, '/');
          if (orig.toLowerCase() !== sugg.toLowerCase() || orig === sugg) continue;
          const { line, col } = getLineCol(index);
          results.push({ file: path.relative(ROOT, file), line, col, original: raw, suggested: suggested });
        } else {
          const info = resolveAliasedImportCaseAware(clean);
          if (!info) continue;
          importsResolvedAndChecked++;
          const suggested = info.suggestedImport;
          const orig = clean.replace(/\\/g, '/');
          const sugg = suggested.replace(/\\/g, '/');
          if (orig.toLowerCase() !== sugg.toLowerCase() || orig === sugg) continue;
          const { line, col } = getLineCol(index);
          results.push({ file: path.relative(ROOT, file), line, col, original: raw, suggested: suggested });
        }
      }
    }
  }

  if (results.length === 0) {
    console.log(`✅ No capitalization-only discrepancies found.
Scanned ${filesScanned} file(s).
Seen ${importsSeen} import(s); resolved & checked ${importsResolvedAndChecked} (relative + aliased).`);
    process.exit(0);
  }

  console.log(`⚠️ Found ${results.length} capitalization-only discrepancy(ies).
Scanned ${filesScanned} file(s).
Seen ${importsSeen} import(s); resolved & checked ${importsResolvedAndChecked} (relative + aliased).\n`);
  for (const r of results) {
    console.log(`• ${r.file}:${r.line}:${r.col}
  import:   ${r.original}
  suggest:  ${r.suggested}\n`);
  }
  console.log('Note: Only letter case is changed; path structure and style are preserved.');
}

main();
