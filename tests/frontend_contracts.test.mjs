import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const clientDir = path.join(projectRoot, 'client');
const clientSrcDir = path.join(clientDir, 'src');

export async function runFrontendContractTests() {
  const testResults = [];
  const logTest = (name, passed, error = null) => {
    testResults.push({ name, passed, error });
    if (passed) {
      console.log(`  ✓ ${name}`);
    } else {
      console.error(`  ✗ ${name}`);
      if (error) console.error(`    ${error.message}`);
    }
  };

  console.log('\n--- Running Frontend Architecture & Contract Tests ---');

  // TEST 1: Package.json dependencies verification (@tanstack/react-query present, axios absent)
  try {
    const pkgPath = path.join(clientDir, 'package.json');
    assert(fs.existsSync(pkgPath), 'client/package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    assert(deps['@tanstack/react-query'], '@tanstack/react-query must be in client/package.json dependencies');
    assert(!deps['axios'], 'axios must NOT be in client/package.json dependencies');
    assert(!devDeps['axios'], 'axios must NOT be in client/package.json devDependencies');

    logTest('client/package.json specifies @tanstack/react-query and excludes axios', true);
  } catch (err) {
    logTest('client/package.json specifies @tanstack/react-query and excludes axios', false, err);
  }

  // TEST 2: Strict zero-axios codebase audit across all client source files
  try {
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          getAllFiles(filePath, fileList);
        } else if (/\.(js|jsx|ts|tsx|html|css|json)$/.test(file)) {
          fileList.push(filePath);
        }
      }
      return fileList;
    };

    const filesToAudit = getAllFiles(clientSrcDir);
    const violations = [];

    for (const filePath of filesToAudit) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (/axios/i.test(line)) {
          // If the word axios appears in an instruction comment about not using axios, exclude,
          // but flag any import, require, or call to axios
          if (
            /import.*axios/i.test(line) ||
            /require\(.*axios.*\)/i.test(line) ||
            /axios\.(get|post|put|patch|delete)/i.test(line) ||
            /axios\(/i.test(line)
          ) {
            violations.push(`${path.relative(clientDir, filePath)}:${index + 1}: ${line.trim()}`);
          }
        }
      });
    }

    assert.equal(violations.length, 0, `Detected axios usage in client:\n${violations.join('\n')}`);
    logTest('Zero instances of axios imports, requires, or invocations across client codebase', true);
  } catch (err) {
    logTest('Zero instances of axios imports, requires, or invocations across client codebase', false, err);
  }

  // TEST 3: main.jsx wraps App in QueryClientProvider
  try {
    const mainPath = path.join(clientSrcDir, 'main.jsx');
    assert(fs.existsSync(mainPath), 'client/src/main.jsx must exist');
    const mainContent = fs.readFileSync(mainPath, 'utf-8');

    assert(/@tanstack\/react-query/.test(mainContent), 'main.jsx must import from @tanstack/react-query');
    assert(/QueryClient/.test(mainContent), 'main.jsx must import and use QueryClient');
    assert(/QueryClientProvider/.test(mainContent), 'main.jsx must import and use QueryClientProvider');
    assert(/new\s+QueryClient\s*\(/m.test(mainContent), 'main.jsx must instantiate new QueryClient()');

    // Ensure QueryClientProvider wraps App
    const hasWrapping = /<QueryClientProvider[^>]*>[\s\S]*?<App\s*\/>[\s\S]*?<\/QueryClientProvider>/.test(mainContent);
    assert(hasWrapping, 'QueryClientProvider must wrap <App /> in main.jsx');

    logTest('main.jsx correctly instantiates QueryClient and wraps App with QueryClientProvider', true);
  } catch (err) {
    logTest('main.jsx correctly instantiates QueryClient and wraps App with QueryClientProvider', false, err);
  }

  // TEST 4: App.jsx uses useQuery, debounced search, and native fetch
  try {
    const appPath = path.join(clientSrcDir, 'App.jsx');
    assert(fs.existsSync(appPath), 'client/src/App.jsx must exist');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert(/useQuery/.test(appContent), 'App.jsx must utilize useQuery');
    assert(/useDebounce/.test(appContent), 'App.jsx must utilize useDebounce');
    assert(/fetch\s*\(/.test(appContent), 'App.jsx must utilize native fetch API');
    assert(/queryKey:\s*\[['"]movies['"]/.test(appContent), 'App.jsx queryKey must include "movies"');

    // Check search input binding (accounting for inline JSX arrow functions like onChange={(e) => ...})
    assert(/<input[\s\S]*?placeholder=["'][^"']*search/i.test(appContent),
           'App.jsx must include search input with search placeholder');

    logTest('App.jsx implements useQuery with ["movies", debouncedSearch], useDebounce, and native fetch', true);
  } catch (err) {
    logTest('App.jsx implements useQuery with ["movies", debouncedSearch], useDebounce, and native fetch', false, err);
  }

  // TEST 5: AddMovieForm.jsx uses useMutation with query invalidation
  try {
    const addPath = path.join(clientSrcDir, 'AddMovieForm.jsx');
    assert(fs.existsSync(addPath), 'client/src/AddMovieForm.jsx must exist');
    const addContent = fs.readFileSync(addPath, 'utf-8');

    assert(/useMutation/.test(addContent), 'AddMovieForm.jsx must utilize useMutation');
    assert(/invalidateQueries/.test(addContent), 'AddMovieForm.jsx must invalidate queries upon movie creation');
    assert(/['"]movies['"]/.test(addContent), 'AddMovieForm.jsx must invalidate query key ["movies"]');
    assert(/method:\s*['"]POST['"]/i.test(addContent), 'AddMovieForm.jsx must issue POST request via native fetch');

    logTest('AddMovieForm.jsx utilizes useMutation with POST and invalidates ["movies"] query', true);
  } catch (err) {
    logTest('AddMovieForm.jsx utilizes useMutation with POST and invalidates ["movies"] query', false, err);
  }

  // TEST 6: MovieCard.jsx uses useMutation for edit and delete with query invalidation
  try {
    const cardPath = path.join(clientSrcDir, 'MovieCard.jsx');
    assert(fs.existsSync(cardPath), 'client/src/MovieCard.jsx must exist');
    const cardContent = fs.readFileSync(cardPath, 'utf-8');

    assert(/useMutation/.test(cardContent), 'MovieCard.jsx must utilize useMutation');
    assert(/invalidateQueries/.test(cardContent), 'MovieCard.jsx must invalidate queries upon edit/delete');
    assert(/['"]movies['"]/.test(cardContent), 'MovieCard.jsx must invalidate query key ["movies"]');
    assert(/method:\s*['"]PATCH['"]/i.test(cardContent), 'MovieCard.jsx must issue PATCH request for edits');
    assert(/method:\s*['"]DELETE['"]/i.test(cardContent), 'MovieCard.jsx must issue DELETE request for deletions');

    logTest('MovieCard.jsx utilizes useMutation for PATCH/DELETE and invalidates ["movies"] query', true);
  } catch (err) {
    logTest('MovieCard.jsx utilizes useMutation for PATCH/DELETE and invalidates ["movies"] query', false, err);
  }

  // TEST 7: Production Build Verification (npm run build / vite build exit code 0)
  try {
    const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
    assert(fs.existsSync(viteBin), 'vite binary must exist in client node_modules');

    const buildOutput = execFileSync(process.execPath, [viteBin, 'build'], {
      cwd: clientDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const distIndex = path.join(clientDir, 'dist', 'index.html');
    assert(fs.existsSync(distIndex), 'client/dist/index.html must be generated by build');

    logTest('Production build (vite build) succeeds with exit code 0 and outputs client/dist', true);
  } catch (err) {
    logTest('Production build (vite build) succeeds with exit code 0 and outputs client/dist', false, err);
  }

  const allPassed = testResults.every((t) => t.passed);
  return { suite: 'Frontend Contracts & Build Suite', tests: testResults, passed: allPassed };
}

// Allow direct execution
if (process.argv[1]?.endsWith('frontend_contracts.test.mjs')) {
  runFrontendContractTests()
    .then((res) => {
      console.log(`\nFrontend tests completed. Result: ${res.passed ? 'PASSED' : 'FAILED'}`);
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Frontend test execution failed:', err);
      process.exit(1);
    });
}
