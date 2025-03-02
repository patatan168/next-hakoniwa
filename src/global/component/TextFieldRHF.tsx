import { omit } from 'es-toolkit';
import { CSSProperties, InputHTMLAttributes } from 'react';
import {
  Controller,
  FieldError,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';

type HelperTextProps = {
  isError: boolean;
  error?: FieldError;
  helperText?: string;
  isBottomSpace?: boolean;
};

const HelperText = ({ isError, error, helperText, isBottomSpace }: HelperTextProps) => {
  const showError = isError && error !== undefined;
  const showHelper = !showError && helperText !== undefined;
  const isSpace = !showHelper && !showError && (isBottomSpace === undefined || isBottomSpace);
  return (
    <>
      {showError && <li className="text-red-600">{error.message}</li>}
      {showHelper && helperText !== undefined && <li>{helperText}</li>}
      {isSpace && <li className="select-none">&thinsp;</li>}
    </>
  );
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

const baseStyle = 'rounded-lg border p-2.5 text-sm';
const defStyle = `${baseStyle} border-gray-300 bg-gray-50/50 text-gray-900 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;

export const TextFieldRHF = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: TextFieldRHFProps<TFieldValues, TName>
) => {
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
        const isError = isTouched && invalid;
        return (
          <ul style={props.style}>
            <li>
              <input
                className={isError ? errorStyle : defStyle}
                {...field}
                {...textFieldProps}
                ref={field.ref}
              />
            </li>
            <HelperText
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
};
