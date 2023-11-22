import { useState, useSyncExternalStore } from 'react';

import { Callback, Snapshot, IObjectScope } from './types';

export function useObjectScope<Type>(initial: Type): IObjectScope<Type> {
  return useState<ObjectScope<Type>>(new ObjectScope<Type>(initial))[0];
}

export class ObjectScope<Type> implements IObjectScope<Type> {
  private data: Type;
  private callbacks: Set<Callback>;

  constructor(initial: Type) {
    this.data = { ...initial };
    this.callbacks = new Set<Callback>();
  }

  private subscribe(callback: Callback) {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private emit() {
    this.callbacks.forEach(callback => {
      callback();
    });
  }

  use<Result = Type>(
    snapshot: Snapshot<Type, Result> = (value: Type) =>
      value as unknown as Result,
  ): Result {
    return useSyncExternalStore(
      callback => {
        return this.subscribe(callback);
      },
      () => snapshot(this.data),
      () => snapshot(this.data),
    );
  }

  get(): Type {
    return this.data;
  }

  set(value: Type): Type {
    this.data = value;
    this.emit();

    return this.data;
  }
}
