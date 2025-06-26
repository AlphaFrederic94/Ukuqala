export const safeMap = <T, U>(
  array: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => U
): U[] => {
  if (!array) return [];
  return Array.isArray(array) ? array.map(callback) : [];
};