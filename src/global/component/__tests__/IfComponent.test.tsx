import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import IfComponent from '../IfComponent';

describe('IfComponent', () => {
  afterEach(() => {
    cleanup();
  });

  it('isRendered が true のとき子要素が表示されること', () => {
    render(
      <IfComponent isRendered={true}>
        <span>表示されるコンテンツ</span>
      </IfComponent>
    );
    expect(screen.getByText('表示されるコンテンツ')).toBeDefined();
  });

  it('isRendered が false のとき子要素が表示されないこと', () => {
    render(
      <IfComponent isRendered={false}>
        <span>非表示コンテンツ</span>
      </IfComponent>
    );
    expect(screen.queryByText('非表示コンテンツ')).toBeNull();
  });
});
