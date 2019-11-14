export function isLogMessage(obj: any): obj is ILogMessage {
  if (!obj) return false;
  if (!obj.style || !obj.message) return false;
  return Object.keys(obj).length === 2;
}

export function box(message: string, bgColor: string = colors.blue, forColor: string = colors.white) {
  return {
    message,
    style: `color: ${forColor}; background-color: ${bgColor}; border-radius: 0.25em; padding: 0.1em 0.3em`,
  };
}

export enum colors {
  red = "#db3236",
  green = "#3cba54",
  orange = "#f4c20d",
  blue = "#4885ed",
  purple = "#663096",
  white = "#ffffff",
  lightGrey = "#BBBBBB",
  grey = "#888888",
  black = "#000000",
}

function createMessage(...messages: Array<string | ILogMessage>) {
  const text = messages.map((m) => isLogMessage(m) ? `%c${m.message}%c` : m).join(" ");

  const styles: any[] = [];
  messages.forEach((m) => {
    if (isLogMessage(m)) {
      styles.push(m.style);
      styles.push(undefined);
    }
  });

  return [text, ...styles];
}

export function log(...messages: Array<string | ILogMessage>) {

  const logItems = createMessage(...messages);
  console.log(...logItems);
}

/** Don't log grouped items (can be easier to filter) */
export let logFlat = false;

export function logGroup<T>(messages: Array<string | ILogMessage>, fn: (...args: any[]) => T) {

  const logItems = createMessage(...messages);

  if (logFlat) {
    console.log(...logItems);
  } else {
    console.group(...logItems);
  }

  try {
    return fn();
  } finally {
    if (!logFlat) console.groupEnd();
  }
}

export function logGroupCollapsed<T>(messages: Array<string | ILogMessage>, fn: (...args: any[]) => T) {

  const logItems = createMessage(...messages);

  if (logFlat) {
    console.log(...logItems);
  } else {
    console.groupCollapsed(...logItems);
  }

  try {
    return fn();
  } finally {
    if (!logFlat) console.groupEnd();
  }
}

declare global {
  interface ILogMessage {
    message: string;
    style: string;
  }
}
