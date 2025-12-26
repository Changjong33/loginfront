declare module 'oxide' {
  export class Result<T, E> {
    isOk(): this is Result<T, never>;
    isErr(): this is Result<never, E>;
    unwrap(): T;
    unwrapErr(): E;
    map<U>(fn: (value: T) => U): Result<U, E>;
    mapErr<F>(fn: (error: E) => F): Result<T, F>;
  }

  export function Ok<T, E = never>(value: T): Result<T, E>;
  export function Err<T = never, E = unknown>(error: E): Result<T, E>;
}

