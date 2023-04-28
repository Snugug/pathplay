import { parentPort, workerData } from 'worker_threads';

for (const scraper of workerData) {
  parentPort.postMessage({ title: scraper.title });
  await import(scraper.url);
}
