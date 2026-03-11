import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Loading from '../Loading';

describe('Loading Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('aria-label "読み込み中" の要素が表示されること', () => {
    render(<Loading />);
    expect(screen.getByLabelText('読み込み中')).toBeDefined();
  });

  it('アニメーション用ドットが3つレンダリングされること', () => {
    render(<Loading />);
    const container = screen.getByLabelText('読み込み中');
    // animate-ping クラスを持つ要素が3つあることを確認
    const dots = container.querySelectorAll('.animate-ping');
    expect(dots.length).toBe(3);
  });
});
