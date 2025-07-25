import React, { useCallback } from 'react';
import { render, screen, Screen, fireEvent, act } from '@testing-library/react';
import { useArrayScope, ArrayScope, IArrayScope } from '../lib';

function ArrayScopeButton(props: { scope: IArrayScope<number> }) {
  const handleClick = useCallback(() => {
    const max = Math.max(...props.scope.get());
    props.scope.set([...props.scope.get(), max + 1]);
  }, [props.scope]);

  return (
    <button title="button" onClick={handleClick}>
      add
    </button>
  );
}

function ArrayScopeValue(props: { scope: IArrayScope<number> }) {
  const value = props.scope.use();

  return <div title="value">{JSON.stringify(value)}</div>;
}

function ArrayScopeParent() {
  const scope = useArrayScope<number>([0]);

  return (
    <>
      <ArrayScopeValue scope={scope}></ArrayScopeValue>
      <ArrayScopeButton scope={scope}></ArrayScopeButton>
    </>
  );
}

function getValue(screen: Screen): any {
  const value = screen.getByTitle('value')?.textContent;
  if (!value) {
    return [];
  }

  return JSON.parse(value);
}

function getButton(screen: Screen): any {
  return screen.getByTitle('button');
}

test('useArrayScope', () => {
  let state: any;

  render(<ArrayScopeParent />);

  // validate the label state
  state = getValue(screen);
  expect(state).toEqual([0]);

  // click the button
  fireEvent.click(getButton(screen));

  // validate the label state
  state = JSON.parse(screen.getByTitle('value').textContent ?? '');
  expect(state).toEqual([0, 1]);
});

test('ArrayScope', () => {
  const scope = new ArrayScope<number>([0]);

  let state: any;

  render(<ArrayScopeValue scope={scope} />);

  // validate the label state
  state = getValue(screen);
  expect(state).toEqual([0]);

  // update the scope
  act(() => {
    scope.set([0, 1]);
  });

  // validate the label state
  state = getValue(screen);
  expect(state).toEqual([0, 1]);
});
