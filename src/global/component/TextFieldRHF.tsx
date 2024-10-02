'use Client';
import { TextField, TextFieldProps } from '@mui/material';
import { omit } from 'es-toolkit';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

type TextFieldRHFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, 'render'> &
  Omit<TextFieldProps, 'onChange' | 'onBlur' | 'value' | 'disabled' | 'name' | 'inputRef'>;

export const TextFieldRHF = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: TextFieldRHFProps<TFieldValues, TName>
) => {
  const textFieldProps = omit(props, ['control', 'rules', 'shouldUnregister', 'helperText']);
  return (
    <Controller
      name={props.name}
      control={props.control}
      defaultValue={props.defaultValue}
      rules={props.rules}
      shouldUnregister={props.shouldUnregister}
      disabled={props.disabled}
      render={({ field, fieldState: { invalid, error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          inputRef={field.ref}
          error={invalid}
          helperText={error !== undefined ? error.message : props.helperText}
        />
      )}
    />
  );
};
