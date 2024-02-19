# @pixelry/react-scopes

Lightweight cross component state management allowing multiple components to independently access, use, and set the same shared state. A simple React solution to signals.

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
  // call `use` to hook the state of the scope and
  // rerender on state changes
  const state = props.scope.use();

  return <span>{state.count}</span>;
}

//
// component that gets and sets scope state
//
function CounterButton(props: { scope: IObjectScope<CounterState> }) {
  // since the scope dependency is unchanging the callback is
  // always the same object
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

[Object Scopes](#object-scopes)

[Array Scopes](#array-scopes)

[Record Scopes](#record-scopes)

[Composition and Performance](#composition-and-performance)

[Stores and Actions](#stores-and-actions)

## Object Scopes

Object Scopes implement the `IObjectScope<Type>` interface which provides a scope for a single object state.

```tsx
interface IObjectScope<Type> {
  use<Result = Type>(snapshot?: Snapshot<Type, Result>): Result;
  get(): Type;
  set(value: Type): Type;
}
```

### `useObjectScope`

Object Scopes can be created with the `useObjectScope` hook.

```tsx
function useObjectScope<Type>(initial: Type): IObjectScope<Type>;
```

Example of creating an object scope in a component.

```tsx
type Viewport = {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
};

const viewportScope = useObjectScope<Viewport>({
  left: 0,
  top: 0,
  scale: 1,
  width: 1024,
  height: 768,
});
```

### `use`

Object Scopes implement a `use` hook for subscribing to the object value.

```tsx
const viewport = viewportScope.use();
```

The `use` hook accepts a snapshot function that memoizes a derivative of the object state. The component rerenders only if the result of the function has changed.

```tsx
// this component rerenders only when the viewport scale changes
const zoom = viewportScope.use<string>(
  (viewport: Viewport) => `${Math.floor(viewport.scale * 100)}%`,
);

return <div>{zoom}</div>; // <div>100%</div>
```

### `get`

Object Scopes implement `get` which returns the current value of the object without needing to `use` the value. This is mostly used in callbacks to avoid adding the value to a hook dependency array.

```tsx
const handleZoomIn = useCallback(() => {
  const viewport = viewportScope.get();
  viewportScope.set({
    ...viewport,
    scale: viewport.scale + 1.0,
  });
}, [viewportScope]);
```

### `set`

Object Scope `set` sets the value of the object. This will trigger all use hooks and results in the rerendering of components using the Object Scope.

```tsx
function resetViewport(viewportScope: IObjectScope<Viewport>) {
  viewportScope.set({
    left: 0,
    top: 0,
    scale: 1,
    width: 1024,
    height: 768,
  });
}
```

### `ObjectScope`

An `ObjectScope` can be directly created outside of a component. This is useful for module singletons, contexts, or as part of other objects such as stores.

```ts
// theme.ts
import { ObjectScope } from '@pixelry/react-scopes';

type Theme = {
  mode: 'dark' | 'light' | 'system';
};

export const themeScope = new ObjectScope<Theme>({ mode: 'system' });
```

```tsx
// app.tsx
import React, { useCallback } from 'react';
import { themeScope } from './theme';

function App() {
  // ...

  const handleToggleTheme = useCallback(() => {
    const next = {
      dark: 'light',
      light: 'system',
      system: 'dark',
    };
    const theme = themeScope.get();
    themeScope.set({
      ...theme,
      mode: next(theme.mode),
    });
  }, []);

  // ...

  const theme = themeScope.use();

  return (
    <div className={`theme-${theme.mode}`}>
      {
        // ...
      }
    </div>
  );
}
```

## Array Scopes

Array Scopes implement the `IArrayScope<Type>` interface which provides a scope for a single array state.

```tsx
interface IArrayScope<Type> {
  use<Result = Type[]>(snapshot?: Snapshot<Type[], Result>): Result;
  get(): Type[];
  set(value: Type[]): Type[];
}
```

### `useArrayScope`

Array Scopes can be created with the `useArrayScope` hook.

```tsx
function useArrayScope<Type>(initial?: Type[]): IArrayScope<Type>;
```

Example of creating an array scope in a component.

```tsx
const versionsScope = useArrayScope<string>([
  'v1.0.0',
  'v1.1.0',
  'v1.1.1',
  'v1.2.0',
]);
```

### `use`

Array Scopes implement a `use` hook for subscribing to the array.

```tsx
const versions = versionsScope.use();
```

The `use` hook accepts a snapshot function that memoizes a derivative of the array. The component rerenders only if the result of the function has changed.

```tsx
// this component rerenders only when the latest version changes
const latest = versionsScope.use<string>(
  (versions: string[]) => versions.slice(-1)[0] ?? 'v0.0.0',
);

return <div>{latest}</div>; // <div>v1.2.0</div>
```

### `get`

Array Scopes implement `get` which returns the current array without needing to `use` the array. This is mostly used in callbacks to avoid adding the value to a hook dependency array.

```tsx
const handlePatch = useCallback(() => {
  const versions = versionsScope.get();
  const latest = versions.slice(-1)[0] ?? 'v0.0.0';
  const patch = (latest.match(/.*\.(0|[1-9]\d*)?$/) ?? ['', '0'])[1];
  const next = Number.parseInt(patch) + 1;

  versionsScope.set([
    ...versions,
    latest.substring(0, latest.length - patch.length) + next),
  ]);
}, [versionsScope]);
```

### `set`

Array Scopes `set` sets the array. This will trigger all use hooks and results in the rerendering of components using the Array Scopes.

```tsx
function resetVersions(versionsScope: IArrayScope<string>) {
  versionsScope.set(['v0.0.0']);
}
```

### `ArrayScope`

An `ArrayScope` can be directly created outside of a component. This is useful for module singletons, contexts, or as part of other objects such as stores.

```ts
// events.ts
import { ArrayScope } from '@pixelry/react-scopes';

export const eventsScope = new ArrayScope<string>();

export function logEvents() {
  console.log(...eventsScope.get());
  eventsScope.set([]);
}

window.logEvents = logEvents;
```

```tsx
// feature.tsx
import React, { useCallback } from 'react';
import { eventsScope } from './events';

function Feature() {
  // ...

  const handleButtonClick = useCallback(() => {
    // ...

    eventsScope.set([...eventScope.get(), 'feature-button-click']);
  }, []);

  // ...
}
```

## Record Scopes

Record Scopes implement the `IRecordScope<Type>` interface which provides a scope for a dictionary of objects.

```tsx
type Key = string | number | symbol;

interface IRecordScope<Type> {
  use<Result = Type>(
    prop: Key,
    snapshot?: Snapshot<Type | undefined, Result | undefined>,
  ): Result | undefined;
  get(prop: Key): Type | undefined;
  set(prop: Key, value: Type): Type;
  delete(prop: Key): void;
}
```

### `useRecordScope`

Record Scopes can be created with the `useRecordScope` hook.

```tsx
function useRecordScope<Type>(initial?: Record<Key, Type>): IRecordScope<Type>;
```

Example of creating a Record Scope in a component.

```tsx
type Employee = {
  name: string;
  title: string;
};

const employeesScope = useRecordScope<Employee>({
  1: {
    name: 'Dan',
    title: 'Lackey',
  },
});
```

### `use`

Record Scopes implement a `use` hook for subscribing to the object given a key. If no object exists at that key it will return `undefined`.

```tsx
const employee = employeesScope.use(1);
```

The `use` hook accepts a snapshot function that memoizes a derivative of the object at the given key. The component rerenders only if the result of the function has changed.

```tsx
// this component rerenders only when the employee name changes
// this can happen when the employee object is newly deleted or created
const name = employeesScope.use<string>(
  (employee: Employee) => `${employee?.name}`,
);

return <div>{name}</div>; // <div>Dan</div>
```

### `get`

Record Scopes implement `get` which returns the object at the provided key index. If there is no object indexed by the key `get` will return `undefined`.

```tsx
const handlePromote = useCallback(
  (id: string) => {
    const employee = employeesScope.get(id);
    if (employee) {
      employeesScope.set(id, {
        ...employee,
        title: 'Senior ' + employee.title,
      });
    }
  },
  [employeesScope],
);
```

### `set`

Record Scopes `set` sets the object for a key overwriting the object if one already exists at the key, otherwise adding a new object at the key.

```tsx
function humbleDan(employeesScope: IRecordScope<Employee>) {
  employeesScope.set(1, {
    name: 'Dan',
    title: 'Junior Lackey',
  });
}
```

### `delete`

Record Scopes `delete` removes the object at the given key. Subscribed components will rerender and the use hooks will return undefined.

```tsx
function reallyHumbleDan(employeesScope: IRecordScope<Employee>) {
  employeesScope.delete(1);
}
```

## Composition and Performance

You may have noticed a pretty big issue with the Record Scope: you can't enumerate the records. This is by design. A bad work around for this could use an Array Scope.

```tsx
type Employee = {
  id: number;
  name: string;
  title: string;
};

// DON'T DO THIS
const employeesScope = useArrayScope<Employee>([
  {
    id: 1,
    name: 'Dan',
    title: 'Lackey',
  },
  {
    id: 2,
    name: 'James',
    title: 'New Hire',
  },
]);
```

**Don't do this!** Anytime you change any employee you will end up rerendering all employees.

Immutable is an amazing tool, but deeply nested data or mixing structure and data can result in terrible performance. The primary motivation for the creation of this library is to enable high performance apps by composing simple shared state.

To demonstrate how composition works let's look at the canonical example.

### Todo List

A todo list has two parts, the list and the items. Keeping the list in a separate immutable object from the items avoids rerendering all items when any one item changes. Like normalizing a database, this can be done by using multiple scopes that connect by strong keys.

Here's a fully functional todo list using scopes.

```tsx
import React, { useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import {
  useRecordScope,
  IRecordScope,
  useArrayScope,
} from '@pixelry/react-scopes';

type Todo = {
  title: string;
  done: boolean;
};

function TodoItem(props: { todoScope: IRecordScope<Todo>; id: string }) {
  // use the specific todo item without using the list
  const todo = props.todoScope.use(props.id);

  // toggle the done flag
  const handleToggle = useCallback(() => {
    const todo = props.todoScope.get(props.id);
    if (todo) {
      props.todoScope.set(props.id, {
        ...todo,
        done: !todo.done,
      });
    }
  }, [props.todoScope, props.id]);

  return (
    todo && (
      <div>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={handleToggle}
        ></input>
        <span>{todo.title}</span>
      </div>
    )
  );
}

export function TodoList() {
  // collection of todo items by id
  const todoScope = useRecordScope<Todo>();
  // array of ids of the todo items
  const listScope = useArrayScope<string>();

  // store the input value in a ref to avoid rerenders
  const valueRef = useRef<string>('');
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      valueRef.current = event.target.value;
    },
    [valueRef],
  );

  // create and add a new todo item
  const handleClick = useCallback(() => {
    const id = nanoid();
    todoScope.set(id, {
      title: valueRef.current,
      done: false,
    });
    listScope.set([...listScope.get(), id]);
  }, [valueRef, todoScope, listScope]);

  // use the list locally
  const list = listScope.use();

  return (
    <div>
      <input onChange={handleChange}></input>
      <button onClick={handleClick}>Add</button>
      {list.map(id => (
        <TodoItem key={id} id={id} todoScope={todoScope}></TodoItem>
      ))}
    </div>
  );
}
```

## Stores and Actions

Stores are not part of this library because it turns out they are trivial to implement using scopes. Let's take a look at what the todo list example could look like using a store and actions. Please note, this opinionated example is a simple and strongly typed approach to flux common here at Pixelry. You can use dispatch functions with action payloads, but they would operate in exactly the same unidirectional way.

Note that the `useList` and `useTodo` allow the specification of the generic types of the snapshot functions for further type specificity.

```tsx
// todo-store.ts
import { nanoid } from 'nanoid';
import { RecordScope, ArrayScope, Snapshot } from '@pixelry/core/scopes';

export type Todo = {
  title: string;
  done: boolean;
};

type TodoSnapshot<Result = Todo> = Snapshot<
  Todo | undefined,
  Result | undefined
>;

export interface ITodoStore {
  useTodo: <Result = Todo>(
    id: string,
    snapshot?: TodoSnapshot<Result>,
  ) => Result | undefined;
  useList: <Result = string[]>(snapshot?: Snapshot<string[], Result>) => Result;
  getTodo: (id: string) => Todo | undefined;
  toggleTodo: (id: string) => void;
  addTodo: (title: string) => string | undefined;
}

export class TodoStore implements ITodoStore {
  private todoScope = new RecordScope<Todo>();
  private listScope = new ArrayScope<string>();

  useTodo<Result = Todo>(
    id: string,
    snapshot?: TodoSnapshot<Result>,
  ): Result | undefined {
    return this.todoScope.use(id, snapshot);
  }

  useList<Result = string[]>(snapshot?: Snapshot<string[], Result>): Result {
    return this.listScope.use(snapshot);
  }

  getTodo(id: string): Todo | undefined {
    return this.todoScope.get(id);
  }

  toggleTodo(id: string): void {
    const todo = this.getTodo(id);
    if (todo) {
      this.todoScope.set(id, {
        title: todo.title,
        done: !todo.done,
      });
    }
  }

  addTodo(title: string): string | undefined {
    const id = nanoid();
    this.todoScope.set(id, {
      title,
      done: false,
    });
    this.listScope.set([...this.listScope.get(), id]);

    return id;
  }
}
```

Using the store now changes the todo list example to below.

```tsx
// todo-list.tsx
import React, { useCallback, useRef, useState } from 'react';
import { TodoStore, ITodoStore } from './todo-store';

function TodoItem(props: { todoStore: ITodoStore; id: string }) {
  const todo = props.todoStore.useTodo(props.id);

  // toggle the done flag
  const handleToggle = useCallback(() => {
    props.todoStore.toggleTodo(props.id);
  }, [props.todoStore, props.id]);

  return (
    todo && (
      <div>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={handleToggle}
        ></input>
        <span>{todo.title}</span>
      </div>
    )
  );
}

export function TodoList() {
  // useState instead of useMemo to persist through hot reload
  const [todoStore] = useState<ITodoStore>(new TodoStore());

  // store the input value in a ref to avoid rerenders
  const valueRef = useRef<string>('');
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      valueRef.current = event.target.value;
    },
    [valueRef],
  );

  // add a new todo item
  const handleClick = useCallback(() => {
    todoStore.addTodo(valueRef.current);
  }, [valueRef, todoStore]);

  // use the list
  const list = todoStore.useList();

  return (
    <div>
      <input onChange={handleChange}></input>
      <button onClick={handleClick}>Add</button>
      {list.map(id => (
        <TodoItem key={id} id={id} todoStore={todoStore}></TodoItem>
      ))}
    </div>
  );
}
```

### Store Composition

Stores can be instanced in local branches of a react component tree, or they can be composed as application level singletons. This library doesn't not make an assumption either way, it provides building blocks that can be assembled together as needed.

For example, an application level context could allow any component to use specific stores or scopes.

```tsx
const appStore = {
  todos: new TodoStore(),
  settings: new SettingStore(),
  account: new AccountStore(),
};
```

```tsx
// useAppStore wraps a useContext hook
import { useAppStore } from '../app.tsx';

function Example() {
  const appStore = useAppStore();

  const todos = appStore.todos.use();
  const settings = appStore.settings.use();
  const account = appStore.account.use();

  // ...
}
```
