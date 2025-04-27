import { omit } from 'es-toolkit';
import { CSSProperties, InputHTMLAttributes, memo, useCallback, useState } from 'react';
import {
  Controller,
  FieldError,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';

type HelperTextProps = {
  style?: CSSProperties;
  isError: boolean;
  error?: FieldError;
  helperText?: string;
  isBottomSpace?: boolean;
};

type TextFieldRHFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, 'render'> &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onBlur' | 'value' | 'disabled' | 'name' | 'inputRef' | 'type'
  > & {
    style?: CSSProperties;
    helperText?: string;
    type?: 'password' | 'text' | 'number' | 'email' | 'tel' | 'search';
    isBottomSpace?: boolean;
  };

const inputStyle = (disabled: boolean | undefined, error: boolean) => {
  const baseStyle = 'rounded-lg border p-2.5 text-sm';
  const defStyle = `${baseStyle} border-gray-300 bg-gray-50/50 text-gray-900 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
  const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;
  const disabledStyle = `${baseStyle} border-gray-300 bg-gray-400/50 text-black cursor-not-allowed`;

  if (disabled) {
    return disabledStyle;
  } else if (error) {
    return errorStyle;
  } else {
    return defStyle;
  }
};

const HelperText = memo(({ style, isError, error, helperText, isBottomSpace }: HelperTextProps) => {
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
    return <></>;
  }
});

function _TextFieldRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: TextFieldRHFProps<TFieldValues, TName>) {
  const textFieldProps = omit(props, [
    'control',
    'rules',
    'style',
    'shouldUnregister',
    'helperText',
  ]);
  return (
    <Controller
      name={props.name}
      control={props.control}
      defaultValue={props.defaultValue}
      rules={props.rules}
      shouldUnregister={props.shouldUnregister}
      disabled={props.disabled}
      render={({ field, fieldState: { isTouched, invalid, error } }) => {
        const isError = props.disabled || (isTouched && invalid);
        const [inputWidth, setInputWidth] = useState('0px');
        const inputCallback = useCallback((node: HTMLInputElement) => {
          if (node !== null) {
            const { width } = node.getBoundingClientRect();
            setInputWidth(`${width}px`);
          }
          field.ref(node);
        }, []);
        return (
          <ul style={props.style}>
            <li>
              <input
                className={inputStyle(props.disabled, isError)}
                {...field}
                {...textFieldProps}
                ref={inputCallback}
              />
            </li>
            <HelperText
              style={{
                maxWidth: inputWidth,
              }}
              isError={isError}
              error={error}
              helperText={props.helperText}
              isBottomSpace={props.isBottomSpace}
            />
          </ul>
        );
      }}
    />
  );
}

export const TextFieldRHF = memo(_TextFieldRHF) as typeof _TextFieldRHF;
