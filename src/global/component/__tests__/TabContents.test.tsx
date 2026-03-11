import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TabContents, { TabType } from '../TabContents';

const tabs: TabType[] = [
  { value: 'a', label: 'タブA' },
  { value: 'b', label: 'タブB' },
  { value: 'c', label: 'タブC', disabled: true },
];

describe('TabContents Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('全タブラベルが表示されること', () => {
    render(<TabContents tabContents={tabs} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('タブA')).toBeDefined();
    expect(screen.getByText('タブB')).toBeDefined();
    expect(screen.getByText('タブC')).toBeDefined();
  });

  it('タブをクリックすると onChange が value を引数に呼ばれること', () => {
    const handleChange = vi.fn();
    render(<TabContents tabContents={tabs} value="a" onChange={handleChange} />);

    screen.getByText('タブB').closest('button')?.click();
    expect(handleChange).toHaveBeenCalledWith('b');
  });

  it('disabled タブは無効化されていること', () => {
    render(<TabContents tabContents={tabs} value="a" onChange={vi.fn()} />);
    const disabledButton = screen.getByText('タブC').closest('button');
    expect(disabledButton?.hasAttribute('disabled')).toBe(true);
  });
});
