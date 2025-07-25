import React, { useCallback } from 'react';
import { render, screen, Screen, fireEvent, act } from '@testing-library/react';
import { useObjectScope, ObjectScope, IObjectScope } from '../lib';

type ObjectScopeData = {
  value: number;
};

function ObjectScopeButton(props: { scope: IObjectScope<ObjectScopeData> }) {
  const handleClick = useCallback(() => {
    props.scope.set({
      value: props.scope.get().value + 1,
    });
  }, [props.scope]);

  return (
    <button title="button" onClick={handleClick}>
      inc
    </button>
  );
}

function ObjectScopeValue(props: { scope: IObjectScope<ObjectScopeData> }) {
  const value = props.scope.use();

  return <div title="value">{JSON.stringify(value)}</div>;
}

function ObjectScopeParent() {
  const scope = useObjectScope<ObjectScopeData>({ value: 0 });

  return (
    <>
      <ObjectScopeValue scope={scope}></ObjectScopeValue>
      <ObjectScopeButton scope={scope}></ObjectScopeButton>
    </>
  );
}

function getValue(screen: Screen): any {
  const value = screen.getByTitle('value')?.textContent;
  if (!value) {
    return {};
  }

  return JSON.parse(value);
}

function getButton(screen: Screen): any {
  return screen.getByTitle('button');
}

test('useObjectScope', () => {
  let state: any;

  render(<ObjectScopeParent />);

  // validate the label state
  state = getValue(screen);
  expect(state.value).toEqual(0);

  // click the button
  fireEvent.click(getButton(screen));

  // validate the label state
  state = getValue(screen);
  expect(state.value).toEqual(1);
});

test('ObjectScope', () => {
  const scope = new ObjectScope<ObjectScopeData>({ value: 0 });

  let state: any;

  render(<ObjectScopeValue scope={scope} />);

  // validate the label state
  state = getValue(screen);
  expect(state.value).toEqual(0);

  act(() => {
    scope.set({
      value: scope.get().value + 1,
    });
  });

  // validate the label state
  state = getValue(screen);
  expect(state.value).toEqual(1);
});
