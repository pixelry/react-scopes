import React, { useCallback } from 'react';
import renderer from 'react-test-renderer';
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

  return <button onClick={handleClick}>inc</button>;
}

function RecordScopeLabel(props: {
  id: string;
  scope: IRecordScope<RecordScopeData>;
}) {
  const value = props.scope.use(props.id) ?? 'unknown';

  return JSON.stringify(value);
}

function RecordScopeParent() {
  const scope = useRecordScope<RecordScopeData>({
    one: { value: 1 },
    two: { value: 2 },
  });

  return (
    <>
      <RecordScopeLabel id="one" scope={scope}></RecordScopeLabel>
      <RecordScopeLabel id="two" scope={scope}></RecordScopeLabel>
      <RecordScopeButton scope={scope}></RecordScopeButton>
    </>
  );
}

test('useRecordScope', () => {
  function getLabelOneState(tree: any): any {
    return JSON.parse(tree.rendered[0].rendered);
  }

  function getLabelTwoState(tree: any): any {
    return JSON.parse(tree.rendered[1].rendered);
  }

  function getButton(tree: any): any {
    return tree.rendered[2].rendered;
  }

  let tree: any;
  let one: any;
  let two: any;
  let button: any;

  const component = renderer.create(<RecordScopeParent />);

  // update the tree
  tree = component.toTree();

  // validate the label state
  one = getLabelOneState(tree);
  expect(one.value).toEqual(1);
  two = getLabelTwoState(tree);
  expect(two.value).toEqual(2);

  renderer.act(() => {
    button = getButton(tree).props.onClick();
    component.update(<RecordScopeParent />);
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  one = getLabelOneState(tree);
  expect(one.value).toEqual(10);
  two = getLabelTwoState(tree);
  expect(two).toEqual('unknown');
});

test('RecordScope', () => {
  function getLabelOneState(tree: any): any {
    return JSON.parse(tree[0].rendered);
  }

  function getLabelTwoState(tree: any): any {
    return JSON.parse(tree[1].rendered);
  }

  const scope = new RecordScope<RecordScopeData>({
    one: { value: 1 },
    two: { value: 2 },
  });

  let tree: any;
  let one: any;
  let two: any;

  const component = renderer.create(
    <>
      <RecordScopeLabel id="one" scope={scope} />
      <RecordScopeLabel id="two" scope={scope} />
    </>,
  );

  // update the tree
  tree = component.toTree();

  // validate the label state
  one = getLabelOneState(tree);
  expect(one.value).toEqual(1);
  two = getLabelTwoState(tree);
  expect(two.value).toEqual(2);

  renderer.act(() => {
    scope.set('one', {
      value: scope.get('one')!.value * 10,
    });
    scope.delete('two');
    component.update(
      <>
        <RecordScopeLabel id="one" scope={scope} />
        <RecordScopeLabel id="two" scope={scope} />
      </>,
    );
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  one = getLabelOneState(tree);
  expect(one.value).toEqual(10);
  two = getLabelTwoState(tree);
  expect(two).toEqual('unknown');
});
