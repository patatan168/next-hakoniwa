import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Overlay from '../Overlay';

describe('Overlay Component', () => {
  beforeEach(() => {
    // portal モード用の DOM ルートを準備
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'overlay-root';
    document.body.appendChild(overlayRoot);
  });

  afterEach(() => {
    cleanup();
    document.getElementById('overlay-root')?.remove();
  });

  it('portal=false のとき直接 div がレンダリングされること', () => {
    render(<Overlay portal={false} data-testid="overlay" />);
    expect(screen.getByTestId('overlay')).toBeDefined();
  });

  it('portal=false でも背景ブラー用クラスが付与されること', () => {
    render(<Overlay portal={false} data-testid="overlay" />);
    const overlay = screen.getByTestId('overlay');
    expect(overlay.className).toContain('bg-black/30');
  });
});
