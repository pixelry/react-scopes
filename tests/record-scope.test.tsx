import React, { useCallback } from 'react';
import { render, screen, Screen, fireEvent, act } from '@testing-library/react';
import { useRecordScope, RecordScope, IRecordScope } from '../lib';

type RecordScopeData = {
  value: number;
};

function RecordScopeButton(props: { scope: IRecordScope<RecordScopeData> }) {
  const handleClick = useCallback(() => {
    const value = props.scope.get('one')?.value ?? 1;
    props.scope.set('one', {
      value: value * 10,
    });
    props.scope.delete('two');
  }, [props.scope]);

  return (
    <button title="button" onClick={handleClick}>
      inc
    </button>
  );
}

function RecordScopeValue(props: {
  id: string;
  scope: IRecordScope<RecordScopeData>;
}) {
  const value = props.scope.use(props.id) ?? 'unknown';

  return <div title="value">{JSON.stringify(value)}</div>;
}

function RecordScopeParent() {
  const scope = useRecordScope<RecordScopeData>({
    one: { value: 1 },
    two: { value: 2 },
  });

  return (
    <>
      <RecordScopeValue id="one" scope={scope}></RecordScopeValue>
      <RecordScopeValue id="two" scope={scope}></RecordScopeValue>
      <RecordScopeButton scope={scope}></RecordScopeButton>
    </>
  );
}

function getValue(screen: Screen, index: number = 0): any {
  const value = screen.getAllByTitle('value')[index]?.textContent;
  if (!value) {
    return {};
  }

  return JSON.parse(value ?? '');
}

function getButton(screen: Screen): any {
  return screen.getByTitle('button');
}

test('useRecordScope', () => {
  let state: any;

  render(<RecordScopeParent />);

  // validate the label state
  state = getValue(screen, 0);
  expect(state.value).toEqual(1);
  state = getValue(screen, 1);
  expect(state.value).toEqual(2);

  // click the button
  fireEvent.click(getButton(screen));

  // validate the label state
  state = getValue(screen, 0);
  expect(state.value).toEqual(10);
  state = getValue(screen, 1);
  expect(state).toEqual('unknown');
});

test('RecordScope', () => {
  let state: any;

  const scope = new RecordScope<RecordScopeData>({
    one: { value: 1 },
    two: { value: 2 },
  });

  render(
    <>
      <RecordScopeValue id="one" scope={scope} />
      <RecordScopeValue id="two" scope={scope} />
    </>,
  );

  // validate the label state
  state = getValue(screen, 0);
  expect(state.value).toEqual(1);
  state = getValue(screen, 1);
  expect(state.value).toEqual(2);

  act(() => {
    scope.set('one', {
      value: scope.get('one')!.value * 10,
    });
    scope.delete('two');
  });

  // validate the label state
  state = getValue(screen, 0);
  expect(state.value).toEqual(10);
  state = getValue(screen, 1);
  expect(state).toEqual('unknown');
});
