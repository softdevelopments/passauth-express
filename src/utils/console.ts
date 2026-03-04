export const logger = ({
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") {
      console.info(...args);
    }
  },
});
