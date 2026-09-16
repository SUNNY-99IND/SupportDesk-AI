/**
 * SupportDesk AI - Core JavaScript Concepts Demonstration
 *
 * This module explicitly demonstrates and exports utilities for:
 * 1. JavaScript Hoisting (Function Declarations vs Temporal Dead Zone)
 * 2. Promises vs Callbacks (new Promise, .then/.catch, and callback promisification)
 * 3. Event Loop Architecture (Call Stack, Microtask Queue vs Macrotask Queue)
 */

// ============================================================================
// 1. JAVASCRIPT HOISTING DEMONSTRATION
// ============================================================================

/**
 * HOISTING CONCEPT:
 * In JavaScript, variable and function declarations are hoisted to the top of
 * their containing scope during the memory allocation / compilation phase.
 *
 * - Function declarations (function foo() {}) are hoisted along with their definition.
 *   This allows them to be safely invoked BEFORE they appear in the source code.
 * - 'let' and 'const' are also hoisted, but they remain in the "Temporal Dead Zone" (TDZ)
 *   until execution reaches their line of declaration. Accessing them beforehand throws ReferenceError.
 * - 'var' is hoisted and initialized to 'undefined'.
 */

// Here we intentionally call 'formatTicketDisplayId' BEFORE its function declaration line:
export const SAMPLE_HOISTED_TICKET_ID = formatTicketDisplayId('tkt-demo-12345');

// Function declaration hoisted to the top of the module scope:
export function formatTicketDisplayId(rawId: string): string {
  if (!rawId) return 'TKT-0000';
  const clean = rawId.replace(/^tkt-/, '').toUpperCase();
  return `SD-${clean.slice(0, 8)}`;
}

/**
 * Formats a badge label demonstrating function hoisting.
 */
export const SAMPLE_BADGE_TEXT = generateBadgeLabel('HIGH', 'OPEN');

export function generateBadgeLabel(priority: string, status: string): string {
  return `[${priority.toUpperCase()}] • ${status.replace('_', ' ')}`;
}

// ============================================================================
// 2. PROMISES VS CALLBACKS DEMONSTRATION
// ============================================================================

/**
 * Traditional Node/DOM Error-First Callback Signature:
 * (error: Error | null, result?: T) => void
 */
export type NodeStyleCallback<T> = (error: Error | null, data?: T) => void;

/**
 * Simulates an asynchronous operation using traditional callbacks.
 * Problem with callbacks: Can lead to "Callback Hell" / "Pyramid of Doom"
 * when nesting sequential operations, and error handling must be duplicated.
 */
export function fetchTicketMetaWithCallback(
  ticketId: string,
  callback: NodeStyleCallback<{ id: string; latencyMs: number; source: string }>
): void {
  const startTime = Date.now();
  setTimeout(() => {
    if (!ticketId) {
      callback(new Error('Invalid ticket ID provided to callback'));
      return;
    }
    callback(null, {
      id: ticketId,
      latencyMs: Date.now() - startTime,
      source: 'callback-queue',
    });
  }, 50);
}

/**
 * Modern Promise Equivalent:
 * Solves Callback Hell by wrapping the asynchronous action inside 'new Promise((resolve, reject) => ...)'.
 * Allows linear chaining with .then(), .catch(), and .finally(), or consumption via async/await.
 */
export function fetchTicketMetaWithPromise(ticketId: string): Promise<{ id: string; latencyMs: number; source: string }> {
  return new Promise((resolve, reject) => {
    // Calling the callback-based function and bridging it into a Promise:
    fetchTicketMetaWithCallback(ticketId, (error, data) => {
      if (error || !data) {
        reject(error || new Error('Unknown error in promise resolution'));
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Demonstrates explicit .then() and .catch() Promise chaining
 */
export function executePromiseChaining(ticketId: string): Promise<string> {
  return fetchTicketMetaWithPromise(ticketId)
    .then((result) => {
      return `Ticket ${result.id} fetched in ${result.latencyMs}ms via Promise`;
    })
    .catch((err: Error) => {
      console.warn('Handled in .catch():', err.message);
      return `Fallback: ${err.message}`;
    });
}

// ============================================================================
// 3. JAVASCRIPT EVENT LOOP (CALL STACK, MICROTASKS & MACROTASKS)
// ============================================================================

/**
 * EVENT LOOP CONCEPT:
 * JavaScript is single-threaded and executes synchronously on the Call Stack.
 * Asynchronous events are offloaded to Web APIs and queued:
 *
 * 1. Call Stack: Synchronous code executes first to completion.
 * 2. Microtask Queue: Promises (.then / async await) and queueMicrotask().
 *    Processed completely immediately after the Call Stack empties, BEFORE any Macrotask.
 * 3. Macrotask (Task) Queue: setTimeout, setInterval, DOM I/O events.
 *    Executed one per loop iteration after all pending microtasks have drained.
 */
export interface EventLoopTraceStep {
  step: number;
  type: 'SYNCHRONOUS' | 'MICROTASK' | 'MACROTASK';
  description: string;
  timestamp: number;
}

/**
 * Executes and captures the exact event loop sequence
 * returning an ordered array of trace logs.
 */
export function traceEventLoopExecution(label = 'SupportDesk'): Promise<EventLoopTraceStep[]> {
  const traces: EventLoopTraceStep[] = [];
  let counter = 1;

  return new Promise((resolve) => {
    // Step 1: Synchronous code (Call Stack)
    traces.push({
      step: counter++,
      type: 'SYNCHRONOUS',
      description: `[${label}] Synchronous statement 1 executed directly on Call Stack`,
      timestamp: performance.now(),
    });

    // Step 4 (Macrotask): Scheduled in the Macrotask Queue via setTimeout
    setTimeout(() => {
      traces.push({
        step: counter++,
        type: 'MACROTASK',
        description: `[${label}] Macrotask (setTimeout) executed from Task Queue`,
        timestamp: performance.now(),
      });
      // Resolve the promise once macrotask finishes
      resolve(traces);
    }, 0);

    // Step 2 (Microtask A): Scheduled in the Microtask Queue via queueMicrotask
    queueMicrotask(() => {
      traces.push({
        step: counter++,
        type: 'MICROTASK',
        description: `[${label}] Microtask A (queueMicrotask) executed before next macrotask`,
        timestamp: performance.now(),
      });
    });

    // Step 3 (Microtask B): Scheduled in the Microtask Queue via Promise.resolve()
    Promise.resolve().then(() => {
      traces.push({
        step: counter++,
        type: 'MICROTASK',
        description: `[${label}] Microtask B (Promise.resolve().then) drained from Microtask Queue`,
        timestamp: performance.now(),
      });
    });

    traces.push({
      step: counter++,
      type: 'SYNCHRONOUS',
      description: `[${label}] Synchronous statement 2 finished on Call Stack`,
      timestamp: performance.now(),
    });
  });
}
