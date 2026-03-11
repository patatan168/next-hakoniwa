import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from '../Modal';

describe('Modal Component', () => {
  beforeEach(() => {
    // Portal 先の DOM ルートを準備
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'overlay-root';
    document.body.appendChild(overlayRoot);
  });

  afterEach(() => {
    cleanup();
    document.getElementById('modal-root')?.remove();
    document.getElementById('overlay-root')?.remove();
  });

  it('open=true のときモーダル本文が表示されること', async () => {
    render(<Modal open={true} openToggle={vi.fn()} body={<p>モーダル本文</p>} />);
    await waitFor(() => {
      expect(screen.getByText('モーダル本文')).toBeDefined();
    });
  });

  it('open=false のときモーダル本文が表示されないこと', async () => {
    render(<Modal open={false} openToggle={vi.fn()} body={<p>非表示本文</p>} />);
    await waitFor(() => {
      expect(screen.queryByText('非表示本文')).toBeNull();
    });
  });

  it('ヘッダー文字列が表示されること', async () => {
    render(<Modal open={true} openToggle={vi.fn()} header="モーダルタイトル" body={<p>本文</p>} />);
    await waitFor(() => {
      expect(screen.getByText('モーダルタイトル')).toBeDefined();
    });
  });

  it('閉じるボタンをクリックすると openToggle(false) が呼ばれること', async () => {
    const openToggle = vi.fn();
    render(<Modal open={true} openToggle={openToggle} header="タイトル" body={<p>本文</p>} />);
    await waitFor(() => {
      screen.getByLabelText('Close');
    });
    fireEvent.click(screen.getByLabelText('Close'));
    expect(openToggle).toHaveBeenCalledWith(false);
  });

  it('Escape キー押下で openToggle(false) が呼ばれること', async () => {
    const openToggle = vi.fn();
    render(<Modal open={true} openToggle={openToggle} body={<p>本文</p>} />);
    await waitFor(() => {
      screen.getByText('本文');
    });
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(openToggle).toHaveBeenCalledWith(false);
  });
});
