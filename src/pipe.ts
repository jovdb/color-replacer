export type OneArgFn<TIn, TOut> = (x: TIn) => TOut;

export function pipe<TIn, TOut, T1, T2, T3>(start: TIn, fn1: OneArgFn<TIn, T1>, fn2: OneArgFn<T1, T2>, fn3: OneArgFn<T2, T3>, fn4: OneArgFn<T3, TOut>): TOut;
export function pipe<TIn, TOut, T1, T2>(start: TIn, fn1: OneArgFn<TIn, T1>, fn2: OneArgFn<T1, T2>, fn3: OneArgFn<T2, TOut>): TOut;
export function pipe<TIn, TOut, T1>(start: TIn, fn1: OneArgFn<TIn, T1>, fn2: OneArgFn<T1, TOut>): TOut;
export function pipe<TIn, TOut>(start: TIn, fn1: OneArgFn<TIn, TOut>): TOut;
export function pipe<TIn>(start: TIn): TIn;
export function pipe<TIn>(start: TIn, ...fns: any[]) {
  // For better type inference, I included the start value as argument
  return fns.reduce((y, f) => f(y), start);
}
