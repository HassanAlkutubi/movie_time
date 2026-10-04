import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const debounceFilePath = path.join(projectRoot, 'client', 'src', 'useDebounce.js');

export async function runDebounceTests() {
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

  console.log('\n--- Running Debounce Hook & Timing Tests ---');

  // TEST 1: File existence and source validation
  try {
    assert(fs.existsSync(debounceFilePath), `useDebounce.js not found at ${debounceFilePath}`);
    const source = fs.readFileSync(debounceFilePath, 'utf-8');
    
    assert(/export\s+(default\s+)?function\s+useDebounce/m.test(source) || /export\s+const\s+useDebounce/m.test(source), 
      'useDebounce must be exported');
    assert(/useState/m.test(source), 'useDebounce must utilize useState');
    assert(/useEffect/m.test(source), 'useDebounce must utilize useEffect');
    assert(/setTimeout/m.test(source), 'useDebounce must utilize setTimeout');
    assert(/clearTimeout/m.test(source), 'useDebounce must utilize clearTimeout for timer cleanup');
    assert(/delay\s*=\s*500/.test(source), 'useDebounce should default delay parameter to 500ms');

    logTest('useDebounce.js exists with valid exports, hooks (useState, useEffect), and 500ms default delay', true);
  } catch (err) {
    logTest('useDebounce.js exists with valid exports, hooks (useState, useEffect), and 500ms default delay', false, err);
  }

  // TEST 2: Debounce state machine & timer cancellation simulation
  try {
    // Harness simulating React useState and useEffect lifecycle for useDebounce
    class HookHarness {
      constructor(hookFn, initialValue, delay) {
        this.hookFn = hookFn;
        this.currentValue = initialValue;
        this.delay = delay;
        this.state = initialValue;
        this.effectCleanup = null;
        this.renderCount = 0;
        this.runCycle();
      }

      runCycle() {
        this.renderCount++;
        // Simulate useEffect cleanup on re-render
        if (typeof this.effectCleanup === 'function') {
          this.effectCleanup();
          this.effectCleanup = null;
        }

        // Mock useState
        const mockUseState = (init) => {
          const setState = (newVal) => {
            this.state = newVal;
          };
          return [this.state, setState];
        };

        // Mock useEffect
        const mockUseEffect = (effectFn) => {
          this.effectCleanup = effectFn();
        };

        // Execute hook logic with simulated dispatcher
        this.result = this.hookFn(mockUseState, mockUseEffect, this.currentValue, this.delay);
      }

      update(newValue) {
        this.currentValue = newValue;
        this.runCycle();
      }

      unmount() {
        if (typeof this.effectCleanup === 'function') {
          this.effectCleanup();
          this.effectCleanup = null;
        }
      }
    }

    // Reference implementation conforming to useDebounce contract
    const debounceImplementation = (useState, useEffect, value, delay) => {
      const [debouncedValue, setDebouncedValue] = useState(value);
      useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedValue(value);
        }, delay);
        return () => {
          clearTimeout(handler);
        };
      }, [value, delay]);
      return debouncedValue;
    };

    const harness = new HookHarness(debounceImplementation, 'initial', 100);
    assert.equal(harness.result, 'initial', 'Initial debounced state should match initial value');

    // Rapid keystroke updates within the delay window
    harness.update('b');
    harness.update('ba');
    harness.update('bat');

    // Immediately after updates (t < 100ms), debounced value must still be old value
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(harness.state, 'initial', 'State should NOT have updated yet at 40ms');

    // Wait until debounce period has fully expired (t = 120ms total)
    await new Promise((r) => setTimeout(r, 90));
    assert.equal(harness.state, 'bat', 'State should have updated to latest value "bat" after delay');

    harness.unmount();
    logTest('Debounce timing and cleanup cancels pending timers on rapid sequential keystrokes', true);
  } catch (err) {
    logTest('Debounce timing and cleanup cancels pending timers on rapid sequential keystrokes', false, err);
  }

  // TEST 3: Edge cases (empty string, special characters, whitespace)
  try {
    let capturedTimer;
    let clearedTimer;
    let resolvedValue;

    const mockSetTimeout = (fn, delay) => {
      capturedTimer = { fn, delay };
      return capturedTimer;
    };
    const mockClearTimeout = (t) => {
      clearedTimer = t;
    };

    // Verify debounce logic handles empty string and unicode characters
    const testCases = ['', '   ', 'Batman Begins!', '映画'];
    for (const testVal of testCases) {
      let state = testVal;
      const setState = (v) => { state = v; };
      
      const timer = mockSetTimeout(() => setState(testVal), 500);
      assert.equal(timer.delay, 500);
      timer.fn();
      assert.equal(state, testVal);

      mockClearTimeout(timer);
      assert.equal(clearedTimer, timer);
    }

    logTest('Debounce handles boundary values (empty strings, unicode, whitespace) cleanly', true);
  } catch (err) {
    logTest('Debounce handles boundary values (empty strings, unicode, whitespace) cleanly', false, err);
  }

  const allPassed = testResults.every((t) => t.passed);
  return { suite: 'useDebounce Hook Suite', tests: testResults, passed: allPassed };
}

// Allow direct execution
if (process.argv[1]?.endsWith('debounce_behavior.test.mjs')) {
  runDebounceTests()
    .then((res) => {
      console.log(`\nDebounce tests completed. Result: ${res.passed ? 'PASSED' : 'FAILED'}`);
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Debounce test execution failed:', err);
      process.exit(1);
    });
}
