import { isEqual, omit } from 'es-toolkit';
import { CSSProperties, InputHTMLAttributes, memo, useMemo, useState } from 'react';
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

const UlStyle = (propsStyle: CSSProperties | undefined) =>
  useMemo(() => {
    const baseWidth = { width: '200px' };
    const uiStyle =
      propsStyle !== undefined && propsStyle.width !== undefined
        ? propsStyle
        : { ...propsStyle, ...baseWidth };

    return uiStyle;
  }, [propsStyle]);

const InputStyle = (error: boolean) =>
  useMemo(() => {
    const baseStyle =
      'w-full h-full rounded-lg border p-2.5 text-sm disabled:border-gray-300 disabled:bg-gray-400/50 disabled:text-black disabled:cursor-not-allowed';
    const defStyle = `${baseStyle} border-gray-300 bg-gray-50/50 dark:bg-white/70 text-gray-900 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
    const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;

    if (error) {
      return errorStyle;
    } else {
      return defStyle;
    }
  }, [error]);

const HelperTextWidth = (inputWidth: number) =>
  useMemo(() => {
    return { maxWidth: `${inputWidth}px` };
  }, [inputWidth]);

const HelperText = memo(
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
      return <></>;
    }
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

function _TextFieldRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: TextFieldRHFProps<TFieldValues, TName>) {
  const textFieldProps = omit(props, [
    'className',
    'control',
    'rules',
    'style',
    'shouldUnregister',
    'helperText',
    'isBottomSpace',
  ]);
  return (
    <Controller
      name={props.name}
      control={props.control}
      defaultValue={props.defaultValue}
      rules={props.rules}
      shouldUnregister={props.shouldUnregister}
      disabled={props.disabled}
      render={({ field, fieldState: { isTouched, isDirty, invalid, error } }) => {
        const isError = props.disabled || ((isTouched || isDirty) && invalid);
        const [inputWidth, setInputWidth] = useState(0);
        const inputCallback = (node: HTMLInputElement) => {
          if (node !== null) {
            const { width } = node.getBoundingClientRect();
            setInputWidth(width);
          }
          field.ref(node);
        };

        return (
          <ul style={UlStyle(props.style)} className={props.className}>
            <li>
              <input
                className={InputStyle(isError)}
                {...field}
                {...textFieldProps}
                ref={inputCallback}
              />
            </li>
            <HelperText
              style={HelperTextWidth(inputWidth)}
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

/**
 * TextFieldRHF is a memoized React component that integrates a text input field with React Hook Form.
 * It provides controlled input handling, validation, and error display.
 * It uses `isEqual` from `es-toolkit` to optimize rendering by preventing unnecessary re-renders.
 * @param {TextFieldRHFProps} props - The properties for the TextFieldRHF component.
 * @returns {JSX.Element} A controlled text input field with validation and error handling.
 * @example
 * <TextFieldRHF
 *   name="username"
 *   control={control}
 *   rules={{ required: 'Username is required' }}
 *   helperText="Enter your username"
 * />
 * @memberof TextFieldRHF
 * @description
 * This component is designed to work seamlessly with React Hook Form, providing a consistent and user-friendly input experience.
 * It supports various input types, validation rules, and customizable styles.
 */
export const TextFieldRHF = memo(_TextFieldRHF, (oldProps, newProps) =>
  isEqual(oldProps, newProps)
) as typeof _TextFieldRHF;
