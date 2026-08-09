import { useEffect, useRef } from 'react';

/*------------------------------
Lerp
------------------------------*/
export const lerp = (v0: number, v1: number, t: number): number =>
  v0 * (1 - t) + v1 * t;

/*--------------------
Get Piramidal Index
--------------------*/
export const getPiramidalIndex = (array: any[], index: number): number[] =>
  array.map((_, i) =>
    index === i ? array.length : array.length - Math.abs(index - i)
  );

/*--------------------
usePrevious Hook
--------------------*/
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
