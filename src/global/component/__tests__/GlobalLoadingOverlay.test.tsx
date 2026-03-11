import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadingCounterStore } from '../../store/loadingCounterStore';
import GlobalLoadingOverlay from '../GlobalLoadingOverlay';

describe('GlobalLoadingOverlay Component', () => {
  beforeEach(() => {
    // カウンタを確実に 0 にリセット
    loadingCounterStore.setState({ count: 0 });
  });

  afterEach(() => {
    cleanup();
    loadingCounterStore.setState({ count: 0 });
  });

  it('count=0 のときオーバーレイが表示されないこと', () => {
    render(<GlobalLoadingOverlay />);
    expect(screen.queryByLabelText('読み込み中')).toBeNull();
  });

  it('count=1 のときオーバーレイが表示されること', () => {
    loadingCounterStore.setState({ count: 1 });
    render(<GlobalLoadingOverlay />);
    expect(screen.getByLabelText('グローバルローディング')).toBeDefined();
  });

  it('count が増えても表示状態が維持されること', () => {
    loadingCounterStore.setState({ count: 3 });
    render(<GlobalLoadingOverlay />);
    expect(screen.getByLabelText('グローバルローディング')).toBeDefined();
  });
});
