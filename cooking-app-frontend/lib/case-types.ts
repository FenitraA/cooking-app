
type CamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<CamelCase<Tail>>}`
    : S;

export type CamelCasedPropertiesDeep<T> =
  T extends Date
    ? Date
    : T extends readonly (infer Item)[]
      ? CamelCasedPropertiesDeep<Item>[]
      : T extends object
        ? {
            [K in keyof T as K extends string
              ? CamelCase<K>
              : K]: CamelCasedPropertiesDeep<T[K]>;
          }
        : T;
