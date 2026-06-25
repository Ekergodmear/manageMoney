/**
 * Core Result type — Success / Failure discriminated union.
 * Narrow with `result.kind === 'success'` — no isSuccess/isFailure helpers.
 * @see docs/DOMAIN-LANGUAGE.md
 */

export type Success<T> = {
  readonly kind: 'success';
  readonly value: T;
};

export type Failure<E> = {
  readonly kind: 'failure';
  readonly error: E;
};

export type Result<T, E> = Success<T> | Failure<E>;

export function success<T>(value: T): Success<T> {
  return { kind: 'success', value };
}

export function failure<E>(error: E): Failure<E> {
  return { kind: 'failure', error };
}
