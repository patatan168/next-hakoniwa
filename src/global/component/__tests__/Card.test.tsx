import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Card } from '../Card';

describe('Card Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('子要素が正しく表示されること', () => {
    render(<Card>カード本文</Card>);
    expect(screen.getByText('カード本文')).toBeDefined();
  });

  it('デフォルトのスタイルクラスが付与されること', () => {
    render(<Card data-testid="card">コンテンツ</Card>);
    const card = screen.getByTestId('card');
    // デフォルトクラスが含まれていることを確認
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('shadow-sm');
  });

  it('追加の className がデフォルトクラスとマージされること', () => {
    render(
      <Card data-testid="card" className="custom-class">
        コンテンツ
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card.className).toContain('custom-class');
    expect(card.className).toContain('bg-white');
  });
});
