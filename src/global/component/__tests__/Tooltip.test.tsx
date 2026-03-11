import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Tooltip from '../Tooltip';

/**
 * ツールチップは createPortal で document.body に直接描画されるため、
 * screen.getByText は body 全体をスキャンするが DOM 上での存在で確認する
 */
describe('Tooltip Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('子要素が表示されること', () => {
    render(
      <Tooltip tooltipComp="ツールチップテキスト">
        <span>トリガー</span>
      </Tooltip>
    );
    expect(screen.getByText('トリガー')).toBeDefined();
  });

  it('ホバー前はツールチップが非表示であること', () => {
    render(
      <Tooltip tooltipComp="ホバー時のテキスト">
        <span>トリガー</span>
      </Tooltip>
    );
    expect(document.body.textContent).not.toContain('ホバー時のテキスト');
  });

  it('mouseenter でツールチップが表示されること', () => {
    const { container } = render(
      <Tooltip tooltipComp="表示テキスト">
        <span>トリガー</span>
      </Tooltip>
    );
    // Tooltip のルート div（relative inline-block）を直接ターゲットにする
    const trigger = container.querySelector('div.relative');
    if (trigger) fireEvent.mouseEnter(trigger);
    expect(document.body.textContent).toContain('表示テキスト');
  });

  it('mouseleave でツールチップが非表示になること', () => {
    const { container } = render(
      <Tooltip tooltipComp="非表示テキスト">
        <span>トリガー</span>
      </Tooltip>
    );
    const trigger = container.querySelector('div.relative');
    if (trigger) {
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
    }
    expect(document.body.textContent).not.toContain('非表示テキスト');
  });
});
