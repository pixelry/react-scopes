# @pixelry/react-scopes

Lightweight cross component state management allowing multiple components to independently access, use, and set the same shared state.

React Scopes require React 18 or higher.

## Quick Start

Installation

`npm i @pixelry/react-scopes`

This example shows efficient state sharing between three components.

```tsx
import React, { useCallback } from 'react';
import { useObjectScope, IObjectScope } from '@pixelry/react-scopes';

type CounterState = {
  count: number;
};

//
// component that creates a scope and shares it with child components
//
export function Counter() {
  // scope is always the same object
  const scope = useObjectScope<CounterState>({ count: 1 });

  // this component does not need the state to render
  // it does not call `use` and will not rerender on state changes
  return (
    <div>
      <CounterValue scope={scope}></CounterValue>
      <CounterButton scope={scope}></CounterButton>
    </div>
  );
}

//
// component that uses scope state
//
function CounterValue(props: { scope: IObjectScope<CounterState> }) {
  // call `use` to hook the state of the scope and rerender on state changes
  const state = props.scope.use();

  return <span>{state.count}</span>;
}

//
// component that gets and sets scope state
//
function CounterButton(props: { scope: IObjectScope<CounterState> }) {
  // since the scope dependency is unchanging the callback is always the same object
  const handleIncrement = useCallback(() => {
    props.scope.set({
      // call `get` for the current state when needed in the callback
      count: props.scope.get().count + 1,
    });
  }, [props.scope]);

  // this component does not need the state to render
  // it does not call `use` and will not rerender on state changes
  return <button onClick={handleIncrement}>+</button>;
}
```

Passing the unchanging scope object as a prop (or via context) allows each participating component to control if they subscribe to changes of the state. If they need to rerender when state changes they can `use` the scope. If they need the state value in a callback they can `get` the value without needing to subscribe via `use`. They can `set` the value of the scope directly without needing to invoke a parent or `use` the state value.

## Documentation

[Object Scopes](https://github.com/pixelry/react-scopes#object-scopes)

[Array Scopes](https://github.com/pixelry/react-scopes#array-scopes)

[Record Scopes](https://github.com/pixelry/react-scopes#record-scopes)

[Composition and Performance](https://github.com/pixelry/react-scopes#composition-and-performance)

[Stores and Actions](https://github.com/pixelry/react-scopes#stores-and-actions)
