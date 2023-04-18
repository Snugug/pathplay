import { Worker } from 'node:worker_threads';

/**
 *
 * @param {object} options - Options object
 * @param {string} options.url - URL of the worker file
 * @param {string} options.title - Name of the item being scraped
 * @param {cli-progress} progress - Progress bar
 * @return {Promise} - Promise that resolves when the worker exits
 */
export function createWorker({ url, title }, progress) {
  return new Promise((resolve, reject) => {
    const opts = { title: title.padEnd(12, ' ') };
    const bar = progress.create(0, -1, opts);
    const worker = new Worker(url);
    worker.on('message', (e) => {
      if (e?.start) {
        bar.start(e.start, 0, opts);
      } else if (e?.total) {
        bar.setTotal(e.total);
      } else {
        bar.increment(1);
      }
    });
    worker.on('error', (e) => console.error(e));
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(new Error(`Worker stopped with exit code ${code}`));
        reject(code);
      } else {
        bar.stop();
        resolve(1);
      }
    });
  });
}
