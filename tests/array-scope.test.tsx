import React, { useCallback } from 'react';
import renderer from 'react-test-renderer';
import { useArrayScope, ArrayScope, IArrayScope } from '../lib';

function ArrayScopeButton(props: { scope: IArrayScope<number> }) {
  const handleClick = useCallback(() => {
    const max = Math.max(...props.scope.get());
    props.scope.set([...props.scope.get(), max + 1]);
  }, [props.scope]);

  return <button onClick={handleClick}>add</button>;
}

function ArrayScopeLabel(props: { scope: IArrayScope<number> }) {
  const value = props.scope.use();

  return JSON.stringify(value);
}

function ArrayScopeParent() {
  const scope = useArrayScope<number>([0]);

  return (
    <>
      <ArrayScopeLabel scope={scope}></ArrayScopeLabel>
      <ArrayScopeButton scope={scope}></ArrayScopeButton>
    </>
  );
}

test('useArrayScope', () => {
  function getLabelState(tree: any): any {
    return JSON.parse(tree.rendered[0].rendered);
  }

  function getButton(tree: any): any {
    return tree.rendered[1].rendered;
  }

  let tree: any;
  let state: any;
  let button: any;

  const component = renderer.create(<ArrayScopeParent />);

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state).toEqual([0]);

  renderer.act(() => {
    button = getButton(tree).props.onClick();
    component.update(<ArrayScopeParent />);
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state).toEqual([0, 1]);
});

test('ArrayScope', () => {
  function getLabelState(tree: any): any {
    return JSON.parse(tree.rendered);
  }

  const scope = new ArrayScope<number>([0]);

  let tree: any;
  let state: any;

  const component = renderer.create(<ArrayScopeLabel scope={scope} />);

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state).toEqual([0]);

  renderer.act(() => {
    scope.set([0, 1]);
    component.update(<ArrayScopeLabel scope={scope} />);
  });

  // update the tree
  tree = component.toTree();

  // validate the label state
  state = getLabelState(tree);
  expect(state).toEqual([0, 1]);
});
