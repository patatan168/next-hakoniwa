import { isEqual } from 'es-toolkit';
import { CSSProperties, memo } from 'react';
import { FieldError } from 'react-hook-form';

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
        <li style={style} className="truncate text-red-600">
          {error.message}
        </li>
      );
    } else if (helperText !== undefined && helperText !== '') {
      // Helper Message
      return (
        <li style={style} className="truncate">
          {helperText}
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
