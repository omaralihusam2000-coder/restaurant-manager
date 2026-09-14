import type ar from "./dictionaries/ar";

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ar>;
export type Locale = "ar" | "en";
