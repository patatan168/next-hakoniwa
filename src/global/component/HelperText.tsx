/**
 * @module HelperText
 * @description フォームフィールド用ヘルパーテキストコンポーネント。
 */
import { isEqual } from '@/global/function/collection';
import { CSSProperties, memo } from 'react';
import { FieldError } from 'react-hook-form';
import Tooltip from './Tooltip';

type HelperTextProps = {
  style?: CSSProperties;
  isError: boolean;
  error?: FieldError;
  helperText?: string;
  isBottomSpace?: boolean;
};

export default memo(
  function HelperText({ style, isError, error, helperText, isBottomSpace }: HelperTextProps) {
    if (isError && error !== undefined) {
      // Error Message
      return (
        <li style={style} className="min-w-0 text-red-600">
          <Tooltip tooltipComp={error.message} smallText>
            <span className="block truncate">{error.message}</span>
          </Tooltip>
        </li>
      );
    } else if (helperText !== undefined && helperText !== '') {
      // Helper Message
      return (
        <li style={style} className="min-w-0">
          <Tooltip tooltipComp={helperText} smallText>
            <span className="block truncate">{helperText}</span>
          </Tooltip>
        </li>
      );
    } else if (isBottomSpace === undefined || isBottomSpace) {
      // Blank Space
      return (
        <li style={style} className="select-none">
          &thinsp;
        </li>
      );
    } else {
      return null;
    }
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
