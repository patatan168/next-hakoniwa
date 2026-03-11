import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HelperText from '../HelperText';

describe('HelperText Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('isError が true のときエラーメッセージが表示されること', () => {
    const error = { type: 'required', message: '必須項目です' };
    render(<HelperText isError={true} error={error} />);
    expect(screen.getByText('必須項目です')).toBeDefined();
  });

  it('helperText が指定されているときヘルパーテキストが表示されること', () => {
    render(<HelperText isError={false} helperText="補足説明" />);
    expect(screen.getByText('補足説明')).toBeDefined();
  });

  it('何も指定されていないとき空白プレースホルダーがレンダリングされること', () => {
    const { container } = render(<HelperText isError={false} />);
    // isBottomSpace デフォルトは true なので li 要素が存在する
    const liElements = container.querySelectorAll('li');
    expect(liElements.length).toBe(1);
  });

  it('isBottomSpace が false かつ内容なしのとき null がレンダリングされること', () => {
    const { container } = render(<HelperText isError={false} isBottomSpace={false} />);
    expect(container.firstChild).toBeNull();
  });
});
