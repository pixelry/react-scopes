export type Callback = () => void;
export type Snapshot<Type, Result = Type> = (snapshot: Type) => Result;

export interface IObjectScope<Type> {
  use<Result = Type>(snapshot?: Snapshot<Type, Result>): Result;
  get(): Type;
  set(value: Type): Type;
}

export interface IArrayScope<Type> {
  use<Result = Type[]>(snapshot?: Snapshot<Type[], Result>): Result;
  get(): Type[];
  set(value: Type[]): Type[];
}

export type Key = string | number | symbol;

export interface IRecordScope<Type> {
  use<Result = Type>(
    prop: Key,
    snapshot?: Snapshot<Type | undefined, Result | undefined>,
  ): Result | undefined;
  get(prop: Key): Type | undefined;
  set(prop: Key, value: Type): Type;
  delete(prop: Key): void;
}
