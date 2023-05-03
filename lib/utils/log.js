/** Create a logger */
export class Logger {
  /**
   *
   * @param {CLIProgress} progress Main progress bar
   */
  constructor(progress) {
    this._progress = progress;
  }

  /**
   *
   * @param {string} t
   * @param {number} length
   * @return {Object}
   */
  bar(t) {
    if (this._progress) {
      const title = t.padEnd(19, ' ');
      const logger = this._progress.create(0, -1, { title });
      return {
        increment(i = 1) {
          logger.increment(i);
        },
        total(total) {
          logger.setTotal(total);
        },
        start(total) {
          logger.start(total, 0, { title });
        },
        stop() {
          logger.stop();
        },
      };
    }
    return {
      increment() {
        return;
      },
      total() {
        return;
      },
      start(total) {
        console.log(`Start: ${total}`);
      },
      stop() {
        console.log(`Done`);
      },
    };
  }
}
