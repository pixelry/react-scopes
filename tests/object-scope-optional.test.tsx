import React, { useCallback } from 'react';
import renderer from 'react-test-renderer';
import { useObjectScope, ObjectScope, IObjectScope } from '../lib';

type ObjectScopeData = {
  value: number;
};

function ObjectScopeButton(props: {
  scope: IObjectScope<ObjectScopeData | undefined>;
}) {
  const handleClick = useCallback(() => {
    props.scope.set({
      value: props.scope.get()?.value ?? 0 + 1,
    });
  }, [props.scope]);

  return <button onClick={handleClick}>inc</button>;
}

function ObjectScopeLabel(props: {
  scope: IObjectScope<ObjectScopeData | undefined>;
}) {
  const value = props.scope.use();

  return JSON.stringify(value);
}

function ObjectScopeParent() {
  const scope = useObjectScope<ObjectScopeData | undefined>(undefined);

  return (
    <>
      <ObjectScopeLabel scope={scope}></ObjectScopeLabel>
      <ObjectScopeButton scope={scope}></ObjectScopeButton>
    </>
  );
}

test('useObjectScope - optional type', () => {
  function getLabelState(tree: any): any {
    return JSON.parse(tree.rendered[0].rendered);
  }

  function getButton(tree: any): any {
    return tree.rendered[1].rendered;
  }

  let tree: any;
  let state: any;
  let button: any;

  const component = renderer.create(<ObjectScopeParent />);

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state.value).toEqual(undefined);

  renderer.act(() => {
    button = getButton(tree).props.onClick();
    component.update(<ObjectScopeParent />);
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state.value).toEqual(1);
});

test('ObjectScope - optional type', () => {
  function getLabelState(tree: any): any {
    return JSON.parse(tree.rendered);
  }

  const scope = new ObjectScope<ObjectScopeData | undefined>(undefined);

  let tree: any;
  let state: any;

  const component = renderer.create(<ObjectScopeLabel scope={scope} />);

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state.value).toEqual(undefined);

  renderer.act(() => {
    scope.set({
      value: scope.get()?.value ?? 0 + 1,
    });
    component.update(<ObjectScopeLabel scope={scope} />);
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state.value).toEqual(1);
});
