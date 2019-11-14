import React, { DependencyList, Dispatch, EffectCallback, MutableRefObject, RefObject, SetStateAction, memo } from "react";
import { box, log } from "../logger";

function updateBox(title = "update") {
  return box(title, "#00a", "#fff");
}

function toString(o: any) {
  try {
    if (typeof o === "function") return (o.name || "anonymous") + "()" ;
    if (typeof o === "object") return JSON.stringify(o);
  } catch(e) {
    return `${o}`;
  }
  return `${o}`;
}

export function useState<S>(initialState: S | (() => S), name: string): [S, Dispatch<SetStateAction<S>>];
export function useState(defaultValue: any, name: string): any[] {
  const [value, setter] = React.useState(defaultValue);

  // Dynamically ncreate a named function
  function newSetter(newValue: any) {
    if (typeof newValue === "function") {
      newValue = newValue(value);
    }

    if (value !== newValue) {
      log(box("useState", "#080", "#fff"), name, updateBox(), `with: ${toString(newValue)}`);
    } else {
      // log(box("useState", "#aaa", "#fff"), `${name}, same value: ${newValue}`);
    }
    return setter(newValue);
  }

  // Create function with dynamic name (for logging function name, example at useCallback dep change)
  function createFunction(name: string, implementation: any) {
    const placeholder = {
      [name](...args: any[]) {
        return implementation(...args);
      },
    };
    return placeholder[name];
  }

  const newSetter2 = React.useCallback(
    createFunction("set" + name[0].toUpperCase() + name.substr(1), newSetter), [value]);
  return [
    value,
    newSetter2,
  ];
}

/** Simple function that logs differences in the deps */
function getDepsDiff(prevDeps: any[], nextDeps: any[]) {
  // Assumed always the same number of deps is used
  let result = "";

  if (prevDeps.length === 0) result = "[]";

  prevDeps
    .forEach((prevValue, index) => {
      const nextValue = nextDeps[index];
      if (prevValue !== nextValue) {
        if (typeof nextValue === "function") result += `, #${index}: ${nextValue.name || "anonymous"}()`;
        else if (typeof nextValue === "object") result += `, #${index}: ${toString(nextValue)}`;
        else result += `, #${index}: ${nextValue}`;
      }
    });
  return result;
}

interface IBothDeps {
  isFirst: boolean;
  prevValue: any[] | undefined;
  currentValue: any[];
}

function useDepsDiffs(deps: any[], onChange: (data: IBothDeps) => void) {

  // remember previous deps so we can check which dep is changed
  const prevDeps = React.useRef<any>({
    deps,
    isFirst: true,
  }); // initail deps

  return React.useMemo(() => {

    onChange({
      isFirst: prevDeps.current.isFirst,
      prevValue: prevDeps.current.isFirst ?  undefined : prevDeps.current.deps,
      currentValue: deps,
    });

    prevDeps.current.deps = deps;
    prevDeps.current.isFirst = false;

  }, deps);
}

function logDepsDiffs(hookName: string, cbName: string, bothDeps: IBothDeps) {

  if (bothDeps.currentValue && bothDeps.currentValue.length === 0) {
    log(box(hookName, "#080", "#fff"), `${cbName}, run once`);
    return;
  }

  if (bothDeps.isFirst) {
    log(box(hookName, "#080", "#fff"), `${cbName}, initial run`);
    return;
  }

  // Assumed always the same number of deps is used
  const nextDeps = bothDeps.currentValue;
  const logs: any[] = [];

  if (bothDeps.prevValue) {
    bothDeps.prevValue
      .forEach((prevValue, index) => {
        const nextValue = nextDeps[index];
        if (prevValue !== nextValue) {
          logs.push(`#${index}: ${toString(nextValue)}`);
        }
      });
  }

  log(box(hookName, "#080", "#fff"), `${cbName}, changed deps:`, ...logs);
}

export function useMemo<T>(factory: () => T, deps: DependencyList | undefined): T;
export function useMemo<T>(factory: any, deps: any): T {

  useDepsDiffs(deps, (v) => {
    logDepsDiffs("useMemo", factory.name || "anonymous", v);
  });

  return React.useMemo(factory, deps);
}

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
export function useCallback(cb: any, deps: any): any {

  useDepsDiffs(deps, (v) => {
    logDepsDiffs("useCallback", cb.name || "anonymous", v);
  });

  return React.useCallback(cb, deps);
}

export function useEffect(effect: EffectCallback, deps: DependencyList): void;
export function useEffect(cb: EffectCallback, deps: any): void {

  useDepsDiffs(deps, (v) => {
    logDepsDiffs("useEffect", cb.name || "anonymous", v);
  });

  return React.useEffect(cb, deps);
}

export function useLayoutEffect(effect: EffectCallback, deps: DependencyList): void;
export function useLayoutEffect(cb: EffectCallback, deps: any): void {

  useDepsDiffs(deps, (v) => {
    logDepsDiffs("useLayoutEffect", cb.name || "anonymous", v);
  });

  return React.useLayoutEffect(cb, deps);
}

export function useRef<T>(initialValue: T, name: string): MutableRefObject<T>;
export function useRef<T>(initialValue: T | null, name: string): RefObject<T>;
export function useRef(initialValue: any, name: string): any {
  React.useMemo(() => log(box("useRef", "#aaa", "#fff"), `${name}, created`), []); // Log once
  return React.useRef(initialValue);
}

/** Delay execution until idle */
/*
export function whenIdle<TFn extends (...args: any[]) => void>(onIdle: TFn): TFn {
  let cancelToken: any;
  return React.useCallback(function addIdleCheck(...args: any[]): any {
    if (cancelToken) (window as any).cancelIdleCallback(cancelToken);
    cancelToken = (window as any).requestIdleCallback(function useIdleRun() {
      onIdle(...args);
    });
  } as TFn, [onIdle]);
}
*/
// /** Delay execution until idle */
// export function useIdleEffect(onIdle: () => void, deps: any[] = []) {
//   const [cancelToken, setCancelToken] = useState(0);
//   const cb = React.useCallback(onIdle, deps);

//   useEffect(function useIdleStart() {

//     setCancelToken((window as any).requestIdleCallback(function useIdleRun() {
//       cb();
//     }));

//     return function useIdleCleanup() {
//       if (cancelToken) (window as any).cancelIdleCallback(cancelToken);
//       // didn't clear token
//     };
//   }, [cb]); // Only restart if cb or its deps are updated
// }

// export function component<P extends object>(
//   Component: React.SFC<P>,
//   propsAreEqual?: (prevProps: Readonly<React.PropsWithChildren<P>>, nextProps: Readonly<React.PropsWithChildren<P>>) => boolean,
// ): React.NamedExoticComponent<P>;

// export function component<T extends React.ComponentType<any>>(
//   Component: T,
//   propsAreEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean,
// ): React.MemoExoticComponent<T>;

// export function component(comp: any): any {

//   // Add memo
//   let newComp = memo((...args) => {
//     log(box(comp.name, "#a00", "#fff"), "called");
//     return comp(...args);
//   });

//   // Add debugging
//   newComp = memo(newComp, () => {
//     log(box(comp.name, "#a00", "#fff"), "props changed");
//     return false;
//   });

//   return newComp;
// }

export interface IWithDebugOptions {
  noMemo?: boolean;
  componentName?: string;
  dontLog?: boolean;
}

export function withDebug<P extends object>(options?: IWithDebugOptions): (
  Component: React.SFC<P>,
  propsAreEqual?: (prevProps: Readonly<React.PropsWithChildren<P>>, nextProps: Readonly<React.PropsWithChildren<P>>) => boolean,
) => React.NamedExoticComponent<P>;

export function withDebug<T extends React.ComponentType<any>>(options?: IWithDebugOptions): (
  Component: T,
  propsAreEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean,
) => React.MemoExoticComponent<T>;

export function withDebug({
  noMemo,
  componentName,
  dontLog,
}: IWithDebugOptions = {}) {

  let compBox: any;

  return <T extends any>(comp: T) => memo((...args) => {
    // Wrapped the component to log at re-render
    compBox = box(componentName || comp.name, "#a00", "#fff");
    log(compBox, "rerender");
    return comp(...args);
  }, (prevProps: any, nextProps: any) => {

    // A simple comparer that logs the properties changed
    if (prevProps === nextProps) return true;

    const prevKeys = prevProps ? Object.keys(prevProps) : [];
    const nextKeys = nextProps ? Object.keys(nextProps) : [];
    let isDiff = false;
    const changes: any = {};
    [...prevKeys, ...nextKeys].forEach((key) => {
      if (changes[key]) return;
      const prevValue = prevProps ? prevProps[key] : undefined;
      const nextValue = nextProps ? nextProps[key] : undefined;
      if (prevValue !== nextValue) {
        changes[key] = {prev: prevValue, next: nextValue};
        isDiff = true;
      }
    });

    if (!dontLog && isDiff) log(compBox, "props changed", JSON.stringify(changes));
    return noMemo
      ? false
      : !isDiff;
  });
}

export const useContext = React.useContext;
