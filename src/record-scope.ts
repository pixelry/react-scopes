import { useState, useSyncExternalStore } from 'react';

import { Callback, Snapshot, Key, IRecordScope } from './types';

export function useRecordScope<Type>(
  initial?: Record<Key, Type>,
): IRecordScope<Type> {
  return useState<IRecordScope<Type>>(new RecordScope<Type>(initial))[0];
}

export class RecordScope<Type> implements IRecordScope<Type> {
  private data: Record<Key, Type>;
  private callbacks: Record<Key, Set<Callback>>;

  constructor(initial: Record<Key, Type> = {}) {
    this.data = { ...initial };
    this.callbacks = {};
  }

  private subscribe(callback: Callback, prop: Key) {
    if (!this.callbacks[prop]) {
      this.callbacks[prop] = new Set();
    }
    this.callbacks[prop].add(callback);

    return () => {
      this.callbacks[prop]?.delete(callback);
    };
  }

  private emit(prop: Key) {
    this.callbacks[prop]?.forEach(callback => {
      callback();
    });
  }

  use<Result = Type>(
    prop: Key,
    snapshot: Snapshot<Type | undefined, Result | undefined> = (
      value: Type | undefined,
    ) => value as unknown as Result | undefined,
  ): Result | undefined {
    return useSyncExternalStore(
      callback => {
        return this.subscribe(callback, prop);
      },
      () => snapshot(this.data[prop]),
      () => snapshot(this.data[prop]),
    );
  }

  get(prop: Key): Type | undefined {
    return this.data[prop];
  }

  set(prop: Key, value: Type): Type {
    this.data[prop] = value;
    this.emit(prop);

    return this.data[prop];
  }

  delete(prop: Key): void {
    delete this.data[prop];
    this.emit(prop);
    this.callbacks[prop]?.clear();
    delete this.callbacks[prop];
  }
}
