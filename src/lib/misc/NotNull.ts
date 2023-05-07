export function NotNull(): never {
  throw new Error('Null or undefined are not acceptable');
}
