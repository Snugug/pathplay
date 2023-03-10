import { parentPort } from 'worker_threads';

/**
 *
 * @param {number} length
 */
export function logStart(length) {
  if (parentPort?.postMessage) {
    parentPort.postMessage({ start: length });
  } else {
    console.log(`Start: ${length}`);
  }
}

/**
 * Increment the counter
 */
export function logIncrement() {
  if (parentPort?.postMessage) {
    parentPort.postMessage({ type: 'increment' });
  } else {
    console.log('Increment');
  }
}
