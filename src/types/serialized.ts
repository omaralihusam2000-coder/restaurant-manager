// Mirrors what a value looks like after a JSON round-trip (e.g. Route Handler
// responses, or `JSON.parse(JSON.stringify(x))` used to seed client state
// with server-fetched data): Date becomes string, everything else recurses.
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;
