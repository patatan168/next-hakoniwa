import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('子要素が正しく表示されること', () => {
    render(<Button>テストボタン</Button>);
    expect(screen.getByText('テストボタン')).toBeDefined();
  });

  it('クリック時に onClick ハンドラが呼ばれること', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    const button = screen.getByRole('button');
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 属性が指定された場合にボタンが無効化されること', () => {
    render(<Button disabled>無効ボタン</Button>);

    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('href 属性が指定された場合に a タグとしてレンダリングされること', () => {
    render(<Button href="/test">リンクボタン</Button>);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/test');
  });

  it('icons プロップが指定された場合にアイコンが表示されること', () => {
    const MockIcon = <span data-testid="mock-icon">★</span>;
    render(<Button icons={MockIcon}>アイコン付き</Button>);

    expect(screen.getByTestId('mock-icon')).toBeDefined();
    expect(screen.getByText('アイコン付き')).toBeDefined();
  });
});
