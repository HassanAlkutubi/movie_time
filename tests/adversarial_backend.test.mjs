import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import movieRoutes from '../routes/movieRoutes.js';

export async function runAdversarialBackendTests() {
  const testResults = [];
  const logTest = (category, name, passed, details = null, error = null) => {
    testResults.push({ category, name, passed, details, error });
    if (passed) {
      console.log(`  ✓ [${category}] ${name}`);
      if (details) console.log(`      Detail: ${details}`);
    } else {
      console.error(`  ✗ [${category}] ${name}`);
      if (details) console.error(`      Detail: ${details}`);
      if (error) console.error(`      Error: ${error.message || error}`);
    }
  };

  console.log('\n======================================================');
  console.log('   ADVERSARIAL BACKEND SEARCH STRESS TEST SUITE       ');
  console.log('======================================================\n');

  const prisma = new PrismaClient();
  let server;
  let baseUrl;
  const createdIds = [];

  try {
    // 1. Setup isolated express test server
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use('/api/movies', movieRoutes);

    server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/movies`;

    // 2. Seed comprehensive adversarial test fixtures
    const adversarialFixtures = [
      // Case variations & standard target
      { title: 'The Batman Adventures (ADV_FIXTURE)', description: 'Gotham heroics', rating: 8.5, releaseYear: 2021 },
      
      // SQL wildcards & special symbols in title
      { title: '100% Pure Cinema % Special (ADV_FIXTURE)', description: 'Percent literal fixture', rating: 9.0, releaseYear: 2020 },
      { title: 'Under_Score_Mystery (ADV_FIXTURE)', description: 'Underscore literal fixture', rating: 7.5, releaseYear: 2019 },
      { title: 'Back\\Slash / Forward (ADV_FIXTURE)', description: 'Backslash literal fixture', rating: 6.8, releaseYear: 2018 },
      { title: "It's Always Sunny 'In' Philadelphia (ADV_FIXTURE)", description: 'Single quote fixture', rating: 8.8, releaseYear: 2017 },
      { title: 'He said "Hello World" (ADV_FIXTURE)', description: 'Double quote fixture', rating: 7.2, releaseYear: 2016 },
      
      // Unicode / Non-ASCII
      { title: 'Le Fabuleux Destin d\'Amélie Poulain (ADV_FIXTURE)', description: 'French accented title', rating: 8.3, releaseYear: 2001 },
      { title: 'Сталкер - Andrei Tarkovsky (ADV_FIXTURE)', description: 'Cyrillic title', rating: 8.1, releaseYear: 1979 },
      { title: '千と千尋の神隠し - Spirited Away (ADV_FIXTURE)', description: 'Japanese kanji title', rating: 8.6, releaseYear: 2001 },
      { title: 'فيلم وثائقي عظيم (ADV_FIXTURE)', description: 'Arabic RTL title', rating: 7.9, releaseYear: 2022 },
      { title: '🎬 The Blockbuster Movie 🍿 🦇 (ADV_FIXTURE)', description: 'Emoji title', rating: 8.0, releaseYear: 2024 },
      
      // Multi-word & spacing
      { title: 'Space    Wars:   Episode   X (ADV_FIXTURE)', description: 'Multiple internal spaces', rating: 5.5, releaseYear: 2025 },
    ];

    for (const fixture of adversarialFixtures) {
      const created = await prisma.movie.create({ data: fixture });
      createdIds.push(created.id);
    }

    // Baseline: Total count of movies including pre-existing ones
    const baselineRes = await fetch(baseUrl);
    assert.equal(baselineRes.status, 200);
    const baselineAllMovies = await baselineRes.json();
    const totalMovieCount = baselineAllMovies.length;
    assert(totalMovieCount >= createdIds.length, 'Database should contain at least all seeded fixtures');

    // ========================================================
    // CATEGORY 1: CASE VARIATIONS (all lowercase, ALL CAPS, mIxEd cAsE)
    // ========================================================
    const caseVariants = ['batman', 'BATMAN', 'BaTmAn', 'bAtMaN', 'bATMAN', 'BatMaN'];
    for (const variant of caseVariants) {
      try {
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(variant)}`);
        assert.equal(res.status, 200, `Expected status 200 for variant "${variant}"`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response');
        const matched = data.filter((m) => createdIds.includes(m.id));
        assert.equal(matched.length, 1, `Expected 1 fixture match for variant "${variant}"`);
        assert.equal(matched[0].title, 'The Batman Adventures (ADV_FIXTURE)');
        logTest('Case Variations', `Query "${variant}" correctly matches case-insensitively`, true, `Returned id ${matched[0].id}`);
      } catch (err) {
        logTest('Case Variations', `Query "${variant}" failed`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 2: SQL WILDCARDS (%, _, \, ', ", SQL injection attempts)
    // ========================================================
    
    // 2a. Percent wildcard '%'
    try {
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent('%')}`);
      assert.equal(res.status, 200, 'Expected status 200 for % search');
      const data = await res.json();
      assert(Array.isArray(data));
      // In Prisma PostgreSQL, contains: "%" searches for literal "%" or pattern match.
      // Check if it safely returns matching records without crashing.
      const hasPercentFixture = data.some((m) => m.title.includes('100% Pure Cinema'));
      assert(hasPercentFixture, 'Search for "%" should return fixture with literal "%" in title');
      logTest('SQL Wildcards', 'Percent "%" search executes safely and matches percent fixture', true, `Matched ${data.length} total records`);
    } catch (err) {
      logTest('SQL Wildcards', 'Percent "%" search failed', false, null, err);
    }

    // 2b. Underscore wildcard '_'
    try {
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent('_')}`);
      assert.equal(res.status, 200, 'Expected status 200 for _ search');
      const data = await res.json();
      assert(Array.isArray(data));
      const hasUnderscoreFixture = data.some((m) => m.title.includes('Under_Score_Mystery'));
      assert(hasUnderscoreFixture, 'Search for "_" should return fixture with literal "_" in title');
      logTest('SQL Wildcards', 'Underscore "_" search executes safely and matches underscore fixture', true, `Matched ${data.length} total records`);
    } catch (err) {
      logTest('SQL Wildcards', 'Underscore "_" search failed', false, null, err);
    }

    // 2c. Backslash '\'
    try {
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent('\\')}`);
      assert.equal(res.status, 200, 'Expected status 200 for \\ search');
      const data = await res.json();
      assert(Array.isArray(data));
      const hasSlashFixture = data.some((m) => m.title.includes('Back\\Slash'));
      assert(hasSlashFixture, 'Search for "\\" should return fixture with literal "\\" in title');
      logTest('SQL Wildcards', 'Backslash "\\" search executes safely and matches backslash fixture', true, `Matched ${data.length} total records`);
    } catch (err) {
      logTest('SQL Wildcards', 'Backslash "\\" search failed', false, null, err);
    }

    // 2d. Single quote "'"
    try {
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent("'")}`);
      assert.equal(res.status, 200, "Expected status 200 for ' search");
      const data = await res.json();
      assert(Array.isArray(data));
      const hasQuoteFixture = data.some((m) => m.title.includes("It's Always Sunny"));
      assert(hasQuoteFixture, 'Search for single quote should return fixture with apostrophe');
      logTest('SQL Wildcards', 'Single quote "\'" search executes safely and matches single-quote fixture', true, `Matched ${data.length} total records`);
    } catch (err) {
      logTest('SQL Wildcards', 'Single quote "\'" search failed', false, null, err);
    }

    // 2e. Double quote '"'
    try {
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent('"')}`);
      assert.equal(res.status, 200, 'Expected status 200 for " search');
      const data = await res.json();
      assert(Array.isArray(data));
      const hasDoubleQuoteFixture = data.some((m) => m.title.includes('He said "Hello World"'));
      assert(hasDoubleQuoteFixture, 'Search for double quote should return fixture with double quotes');
      logTest('SQL Wildcards', 'Double quote "\\"" search executes safely and matches double-quote fixture', true, `Matched ${data.length} total records`);
    } catch (err) {
      logTest('SQL Wildcards', 'Double quote "\\"" search failed', false, null, err);
    }

    // 2f. SQL Injection Payloads
    const sqliPayloads = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "'; DROP TABLE \"Movie\"; --",
      "' UNION SELECT NULL, NULL, NULL, NULL, NULL --",
      "1' ORDER BY 1--+",
      "admin'--",
      "\\'; EXEC xp_cmdshell('dir'); --",
      "' OR ''='",
    ];

    for (const sqli of sqliPayloads) {
      try {
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(sqli)}`);
        assert.equal(res.status, 200, `Expected status 200 for SQLi attempt: ${sqli}`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response for SQLi attempt');
        // Because Prisma uses parameterized queries, the payload is treated as a literal search string.
        // It should match 0 fixtures (none of the fixtures literally contain the SQLi string).
        const matchedFixtures = data.filter((m) => createdIds.includes(m.id));
        assert.equal(matchedFixtures.length, 0, `SQLi payload "${sqli}" must not bypass WHERE clause or dump records`);
        logTest('SQL Wildcards & SQLi', `SQLi attempt blocked & sanitized: "${sqli}"`, true, `Returned 0 unexpected records`);
      } catch (err) {
        logTest('SQL Wildcards & SQLi', `SQLi attempt caused error: "${sqli}"`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 3: UNICODE AND NON-ASCII QUERIES
    // ========================================================
    const unicodeTests = [
      { name: 'Accented Latin (Amélie)', query: 'Amélie', expectedTitle: 'Le Fabuleux Destin d\'Amélie Poulain (ADV_FIXTURE)' },
      { name: 'Accented Latin lowercase (amélie)', query: 'amélie', expectedTitle: 'Le Fabuleux Destin d\'Amélie Poulain (ADV_FIXTURE)' },
      { name: 'Cyrillic (Сталкер)', query: 'Сталкер', expectedTitle: 'Сталкер - Andrei Tarkovsky (ADV_FIXTURE)' },
      { name: 'Cyrillic lowercase (сталкер)', query: 'сталкер', expectedTitle: 'Сталкер - Andrei Tarkovsky (ADV_FIXTURE)' },
      { name: 'Japanese Kanji (千と千尋の神隠し)', query: '千と千尋の神隠し', expectedTitle: '千と千尋の神隠し - Spirited Away (ADV_FIXTURE)' },
      { name: 'Japanese Kanji partial (神隠し)', query: '神隠し', expectedTitle: '千と千尋の神隠し - Spirited Away (ADV_FIXTURE)' },
      { name: 'Arabic (وثائقي)', query: 'وثائقي', expectedTitle: 'فيلم وثائقي عظيم (ADV_FIXTURE)' },
      { name: 'Emoji (🎬)', query: '🎬', expectedTitle: '🎬 The Blockbuster Movie 🍿 🦇 (ADV_FIXTURE)' },
      { name: 'Emoji (🦇)', query: '🦇', expectedTitle: '🎬 The Blockbuster Movie 🍿 🦇 (ADV_FIXTURE)' },
    ];

    for (const uTest of unicodeTests) {
      try {
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(uTest.query)}`);
        assert.equal(res.status, 200, `Expected status 200 for unicode query "${uTest.query}"`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response');
        const matched = data.filter((m) => createdIds.includes(m.id));
        assert.equal(matched.length, 1, `Expected 1 fixture match for "${uTest.query}"`);
        assert.equal(matched[0].title, uTest.expectedTitle);
        logTest('Unicode & Non-ASCII', `${uTest.name} matched correctly`, true, `Matched: "${matched[0].title}"`);
      } catch (err) {
        logTest('Unicode & Non-ASCII', `${uTest.name} failed`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 4: VERY LONG SEARCH QUERIES (500+ characters)
    // ========================================================
    const longLengths = [500, 1000, 2048, 4096];
    for (const len of longLengths) {
      try {
        const longQuery = 'A'.repeat(len);
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(longQuery)}`);
        assert.equal(res.status, 200, `Expected status 200 for query length ${len}`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response for long query');
        assert.equal(data.length, 0, `Expected 0 matches for long query of length ${len}`);
        logTest('Long Queries', `Long query (${len} chars) handled safely without buffer overflow or crash`, true, `Status 200, returned []`);
      } catch (err) {
        logTest('Long Queries', `Long query (${len} chars) failed`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 5: WHITESPACE PERMUTATIONS
    // ========================================================
    const whitespaceTests = [
      { name: 'Leading spaces ("   batman")', query: '   batman', expectedCount: 1 },
      { name: 'Trailing spaces ("batman   ")', query: 'batman   ', expectedCount: 1 },
      { name: 'Leading and trailing spaces ("   batman   ")', query: '   batman   ', expectedCount: 1 },
      { name: 'Tabs ("\\tbatman\\t")', query: '\tbatman\t', expectedCount: 1 },
      { name: 'Newlines ("\\nbatman\\r\\n")', query: '\nbatman\r\n', expectedCount: 1 },
      { name: 'Internal multiple spaces ("Space    Wars")', query: 'Space    Wars', expectedTitle: 'Space    Wars:   Episode   X (ADV_FIXTURE)' },
      { name: 'Whitespace-only spaces ("   ")', query: '   ', expectedAll: true },
      { name: 'Whitespace-only tabs and newlines ("\\t\\n\\r  ")', query: '\t\n\r  ', expectedAll: true },
    ];

    for (const wsTest of whitespaceTests) {
      try {
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(wsTest.query)}`);
        assert.equal(res.status, 200, `Expected status 200 for whitespace test "${wsTest.name}"`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response');

        if (wsTest.expectedAll) {
          // Whitespace-only should trim to empty and return ALL movies
          assert.equal(data.length, totalMovieCount, `Whitespace-only query should return all ${totalMovieCount} movies`);
          logTest('Whitespace Handling', `${wsTest.name} safely normalized to empty and returned all movies`, true, `Returned ${data.length} movies`);
        } else if (wsTest.expectedTitle) {
          const matched = data.filter((m) => createdIds.includes(m.id));
          assert.equal(matched.length, 1);
          assert.equal(matched[0].title, wsTest.expectedTitle);
          logTest('Whitespace Handling', `${wsTest.name} matched exact internal spacing`, true, `Matched: "${matched[0].title}"`);
        } else {
          const matched = data.filter((m) => createdIds.includes(m.id));
          assert.equal(matched.length, wsTest.expectedCount);
          logTest('Whitespace Handling', `${wsTest.name} trimmed correctly and matched fixture`, true, `Matched ${matched.length} fixtures`);
        }
      } catch (err) {
        logTest('Whitespace Handling', `${wsTest.name} failed`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 6: EMPTY QUERY STRING AND OMITTED QUERY
    // ========================================================
    // 6a. Omitted query parameter (GET /api/movies)
    try {
      const res = await fetch(`${baseUrl}`);
      assert.equal(res.status, 200, 'Expected status 200 for omitted search query');
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');
      assert.equal(data.length, totalMovieCount, `Expected all ${totalMovieCount} movies for omitted search`);
      logTest('Empty / Omitted Query', 'Omitted query parameter returns all movies', true, `Returned ${data.length} records`);
    } catch (err) {
      logTest('Empty / Omitted Query', 'Omitted query parameter failed', false, null, err);
    }

    // 6b. Explicit empty string (GET /api/movies?search=)
    try {
      const res = await fetch(`${baseUrl}?search=`);
      assert.equal(res.status, 200, 'Expected status 200 for empty search string');
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');
      assert.equal(data.length, totalMovieCount, `Expected all ${totalMovieCount} movies for empty search string`);
      logTest('Empty / Omitted Query', 'Empty query string (?search=) returns all movies', true, `Returned ${data.length} records`);
    } catch (err) {
      logTest('Empty / Omitted Query', 'Empty query string (?search=) failed', false, null, err);
    }

    // ========================================================
    // CATEGORY 7: NON-MATCHING QUERIES
    // ========================================================
    const nonMatchingQueries = [
      'NON_EXISTENT_QUERY_RANDOM_XYZ_1234567890',
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      '<!DOCTYPE html><html><body>Error</body></html>',
    ];

    for (const nmQuery of nonMatchingQueries) {
      try {
        const res = await fetch(`${baseUrl}?search=${encodeURIComponent(nmQuery)}`);
        assert.equal(res.status, 200, `Expected status 200 for non-matching query "${nmQuery}"`);
        const data = await res.json();
        assert(Array.isArray(data), 'Expected array response');
        assert.equal(data.length, 0, `Expected empty array [] for query "${nmQuery}", got ${data.length}`);
        logTest('Non-Matching Queries', `Query "${nmQuery.slice(0, 25)}..." returns empty array [] without error`, true, `Returned []`);
      } catch (err) {
        logTest('Non-Matching Queries', `Query "${nmQuery}" failed`, false, null, err);
      }
    }

    // ========================================================
    // CATEGORY 8: MALFORMED / DEFENSIVE INPUT HANDLING
    // ========================================================
    // 8a. Repeated parameter producing array (?search=foo&search=bar)
    try {
      const res = await fetch(`${baseUrl}?search=batman&search=superman`);
      assert.equal(res.status, 200, 'Expected status 200 when search is array');
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');
      // When search is an array, typeof search is 'object' (not 'string'), so searchTerm becomes ''
      // It returns all movies rather than throwing TypeError: search.trim is not a function
      assert.equal(data.length, totalMovieCount, 'Array search param should safely fallback to returning all movies');
      logTest('Defensive Input Handling', 'Array query param (?search=a&search=b) handled safely without crash', true, 'Handled without TypeError');
    } catch (err) {
      logTest('Defensive Input Handling', 'Array query param caused error', false, null, err);
    }

    // 8b. Object parameter (?search[key]=value)
    try {
      const res = await fetch(`${baseUrl}?search[nested]=attempt`);
      assert.equal(res.status, 200, 'Expected status 200 when search is object');
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');
      assert.equal(data.length, totalMovieCount, 'Object search param should safely fallback to returning all movies');
      logTest('Defensive Input Handling', 'Object query param (?search[nested]=val) handled safely without crash', true, 'Handled without TypeError');
    } catch (err) {
      logTest('Defensive Input Handling', 'Object query param caused error', false, null, err);
    }

  } finally {
    // Clean up all seeded test fixtures
    if (createdIds.length > 0) {
      try {
        await prisma.movie.deleteMany({
          where: { id: { in: createdIds } },
        });
      } catch (cleanErr) {
        console.error('Warning: Error cleaning up test records:', cleanErr.message);
      }
    }
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  }

  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;
  const allPassed = failedCount === 0;

  console.log('\n======================================================');
  console.log(`   ADVERSARIAL SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED   `);
  console.log(`   OVERALL VERDICT: ${allPassed ? 'ALL PASSED (APPROVE)' : 'FAILURES DETECTED (REJECT)'}`);
  console.log('======================================================\n');

  return { suite: 'Adversarial Backend Search Suite', total: testResults.length, passedCount, failedCount, tests: testResults, passed: allPassed };
}

// Allow direct execution
if (process.argv[1]?.endsWith('adversarial_backend.test.mjs')) {
  runAdversarialBackendTests()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error running adversarial tests:', err);
      process.exit(1);
    });
}
