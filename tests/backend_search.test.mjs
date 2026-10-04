import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import movieRoutes from '../routes/movieRoutes.js';

export async function runBackendTests() {
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

  console.log('\n--- Running Backend Search & API Tests ---');

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

    // 2. Seed test fixtures
    const fixtureMovies = [
      { title: 'Batman Begins (TEST_FIXTURE)', description: 'Origin of Batman', rating: 8.2, releaseYear: 2005 },
      { title: 'The Dark Knight (TEST_FIXTURE)', description: 'Batman vs Joker', rating: 9.0, releaseYear: 2008 },
      { title: 'The Dark Knight Rises (TEST_FIXTURE)', description: 'Bane revolution', rating: 8.4, releaseYear: 2012 },
      { title: 'Batman v Superman: Dawn of Justice (TEST_FIXTURE)', description: 'DC battle', rating: 6.5, releaseYear: 2016 },
      { title: 'Inception (TEST_FIXTURE)', description: 'Dream architecture', rating: 8.8, releaseYear: 2010 },
      { title: 'Spider-Man: Across the Spider-Verse (2023) [Special & Edition]! (TEST_FIXTURE)', description: 'Multiverse journey', rating: 8.7, releaseYear: 2023 },
      { title: 'Alien (TEST_FIXTURE)', description: 'Deep space horror', rating: 8.5, releaseYear: 1979 },
    ];

    for (const movieData of fixtureMovies) {
      const created = await prisma.movie.create({ data: movieData });
      createdIds.push(created.id);
    }

    // TEST 1: GET /api/movies?search=batman returns only movies with "batman" (case-insensitive) in title
    try {
      const res = await fetch(`${baseUrl}?search=batman`);
      assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');

      const fixtureMatches = data.filter((m) => createdIds.includes(m.id));
      assert.equal(fixtureMatches.length, 2, `Expected 2 matching fixture movies for 'batman', got ${fixtureMatches.length}`);
      
      const titles = fixtureMatches.map((m) => m.title);
      assert(titles.includes('Batman Begins (TEST_FIXTURE)'), 'Missing Batman Begins');
      assert(titles.includes('Batman v Superman: Dawn of Justice (TEST_FIXTURE)'), 'Missing Batman v Superman');
      assert(!titles.includes('The Dark Knight (TEST_FIXTURE)'), 'Should not match The Dark Knight');
      assert(!titles.includes('Inception (TEST_FIXTURE)'), 'Should not match Inception');

      // Verify all returned results contain "batman" (case-insensitive)
      for (const m of data) {
        assert(/batman/i.test(m.title), `Result title "${m.title}" does not contain "batman"`);
      }

      logTest('GET /api/movies?search=batman returns only movies with "batman" (case-insensitive)', true);
    } catch (err) {
      logTest('GET /api/movies?search=batman returns only movies with "batman" (case-insensitive)', false, err);
    }

    // TEST 2: Case-insensitivity (BATMAN vs BaTmAn vs batman)
    try {
      const resUpper = await fetch(`${baseUrl}?search=BATMAN`);
      const resMixed = await fetch(`${baseUrl}?search=BaTmAn`);
      const dataUpper = await resUpper.json();
      const dataMixed = await resMixed.json();

      const upperFixtureIds = dataUpper.filter((m) => createdIds.includes(m.id)).map((m) => m.id).sort();
      const mixedFixtureIds = dataMixed.filter((m) => createdIds.includes(m.id)).map((m) => m.id).sort();
      assert.deepEqual(upperFixtureIds, mixedFixtureIds, 'Upper and mixed case search should return identical fixture results');
      assert.equal(upperFixtureIds.length, 2, 'Expected 2 results');

      logTest('Search is strictly case-insensitive (BATMAN vs BaTmAn match identically)', true);
    } catch (err) {
      logTest('Search is strictly case-insensitive (BATMAN vs BaTmAn match identically)', false, err);
    }

    // TEST 3: GET /api/movies (no search parameter) returns all movies
    try {
      const res = await fetch(`${baseUrl}`);
      assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');

      const foundFixtureIds = data.map((m) => m.id).filter((id) => createdIds.includes(id));
      assert.equal(foundFixtureIds.length, createdIds.length, `Expected all ${createdIds.length} seeded fixture movies to be returned`);

      logTest('GET /api/movies (no search parameter) returns all movies', true);
    } catch (err) {
      logTest('GET /api/movies (no search parameter) returns all movies', false, err);
    }

    // TEST 4: Empty search string GET /api/movies?search= returns all movies
    try {
      const res = await fetch(`${baseUrl}?search=`);
      assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');

      const foundFixtureIds = data.map((m) => m.id).filter((id) => createdIds.includes(id));
      assert.equal(foundFixtureIds.length, createdIds.length, `Expected all ${createdIds.length} seeded fixture movies when search is empty`);

      logTest('Empty search string GET /api/movies?search= returns all movies', true);
    } catch (err) {
      logTest('Empty search string GET /api/movies?search= returns all movies', false, err);
    }

    // TEST 5: Whitespace-only search string GET /api/movies?search=%20%20 returns all movies
    try {
      const res = await fetch(`${baseUrl}?search=%20%20%20`);
      assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');

      const foundFixtureIds = data.map((m) => m.id).filter((id) => createdIds.includes(id));
      assert.equal(foundFixtureIds.length, createdIds.length, `Expected all ${createdIds.length} seeded fixture movies when search is whitespace`);

      logTest('Whitespace search string GET /api/movies?search=   returns all movies', true);
    } catch (err) {
      logTest('Whitespace search string GET /api/movies?search=   returns all movies', false, err);
    }

    // TEST 6: Non-matching search returns empty array []
    try {
      const res = await fetch(`${baseUrl}?search=NonExistentMovieQuery_XYZ_9876543210`);
      assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
      const data = await res.json();
      assert(Array.isArray(data), 'Expected array response');
      assert.equal(data.length, 0, `Expected empty array [], got ${data.length} items`);

      logTest('Non-matching search returns empty array []', true);
    } catch (err) {
      logTest('Non-matching search returns empty array []', false, err);
    }

    // TEST 7: Partial match search ("dark" -> "The Dark Knight", "The Dark Knight Rises")
    try {
      const res = await fetch(`${baseUrl}?search=dark`);
      const data = await res.json();
      const fixtureMatches = data.filter((m) => createdIds.includes(m.id));
      assert.equal(fixtureMatches.length, 2, `Expected 2 matches for 'dark', got ${fixtureMatches.length}`);
      const titles = fixtureMatches.map((m) => m.title);
      assert(titles.includes('The Dark Knight (TEST_FIXTURE)'));
      assert(titles.includes('The Dark Knight Rises (TEST_FIXTURE)'));

      logTest('Partial match search works properly (e.g. "dark" matches both Dark Knight films)', true);
    } catch (err) {
      logTest('Partial match search works properly (e.g. "dark" matches both Dark Knight films)', false, err);
    }

    // TEST 8: Special characters in search query ("Special & Edition", "[Special", "!")
    try {
      // 8a: Ampersand
      const resAmp = await fetch(`${baseUrl}?search=${encodeURIComponent('Special & Edition')}`);
      assert.equal(resAmp.status, 200);
      const dataAmp = await resAmp.json();
      const ampFixture = dataAmp.filter((m) => createdIds.includes(m.id));
      assert.equal(ampFixture.length, 1, 'Expected 1 match for "Special & Edition"');
      assert(ampFixture[0].title.includes('[Special & Edition]!'));

      // 8b: Square bracket
      const resBracket = await fetch(`${baseUrl}?search=${encodeURIComponent('[Special')}`);
      assert.equal(resBracket.status, 200);
      const dataBracket = await resBracket.json();
      const bracketFixture = dataBracket.filter((m) => createdIds.includes(m.id));
      assert.equal(bracketFixture.length, 1, 'Expected 1 match for "[Special"');

      // 8c: Exclamation mark
      const resExcl = await fetch(`${baseUrl}?search=${encodeURIComponent('!')}`);
      assert.equal(resExcl.status, 200);
      const dataExcl = await resExcl.json();
      const exclFixture = dataExcl.filter((m) => createdIds.includes(m.id));
      assert(exclFixture.length >= 1, 'Expected at least 1 match for "!"');

      logTest('Special characters in search query work safely and properly (&, [, !)', true);
    } catch (err) {
      logTest('Special characters in search query work safely and properly (&, [, !)', false, err);
    }

    // TEST 9: Full CRUD Contract verification (POST, PATCH, DELETE)
    let crudMovieId;
    try {
      // POST
      const createRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Interstellar (TEST_CRUD)',
          description: 'Wormhole exploration',
          rating: 8.6,
          releaseYear: 2014,
        }),
      });
      assert.equal(createRes.status, 200, `POST returned status ${createRes.status}`);
      const createdMovie = await createRes.json();
      assert(createdMovie.id, 'Created movie must have an id');
      crudMovieId = createdMovie.id;
      assert.equal(createdMovie.title, 'Interstellar (TEST_CRUD)');

      // PATCH
      const patchRes = await fetch(`${baseUrl}/${crudMovieId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Interstellar - Remastered (TEST_CRUD)',
          rating: 9.1,
          releaseYear: 2014,
        }),
      });
      assert.equal(patchRes.status, 200, `PATCH returned status ${patchRes.status}`);
      const updatedMovie = await patchRes.json();
      assert.equal(updatedMovie.title, 'Interstellar - Remastered (TEST_CRUD)');
      assert.equal(updatedMovie.rating, 9.1);

      // DELETE
      const deleteRes = await fetch(`${baseUrl}/${crudMovieId}`, {
        method: 'DELETE',
      });
      assert.equal(deleteRes.status, 200, `DELETE returned status ${deleteRes.status}`);
      const deletedMovie = await deleteRes.json();
      assert.equal(deletedMovie.id, crudMovieId);

      // Verify deletion
      const verifyRes = await fetch(`${baseUrl}?search=TEST_CRUD`);
      const verifyData = await verifyRes.json();
      assert.equal(verifyData.length, 0, 'Deleted movie should no longer exist in search results');

      logTest('Full CRUD endpoints (POST, PATCH, DELETE) execute and maintain contract', true);
    } catch (err) {
      logTest('Full CRUD endpoints (POST, PATCH, DELETE) execute and maintain contract', false, err);
      if (crudMovieId) createdIds.push(crudMovieId);
    }

  } finally {
    // Cleanup seeded fixtures
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

  const allPassed = testResults.every((t) => t.passed);
  return { suite: 'Backend API & Search Suite', tests: testResults, passed: allPassed };
}

// Allow direct execution
if (process.argv[1]?.endsWith('backend_search.test.mjs')) {
  runBackendTests()
    .then((res) => {
      console.log(`\nBackend tests completed. Result: ${res.passed ? 'PASSED' : 'FAILED'}`);
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Backend test execution failed:', err);
      process.exit(1);
    });
}
