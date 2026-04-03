/**
 * @module SelectRHF
 * @description React Hook Form対応のセレクトボックスコンポーネント。
 */
import { isEqual, omit, pick } from '@/global/function/collection';
import dynamic from 'next/dynamic';
import {
  CSSProperties,
  memo,
  OptionHTMLAttributes,
  SelectHTMLAttributes,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  Controller,
  ControllerRenderProps,
  DeepPartial,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
const HelperText = dynamic(() => import('./HelperText'), { ssr: false });

type SelectRHFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, 'render'> &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'onChange' | 'onBlur' | 'value' | 'disabled' | 'name' | 'inputRef' | 'type'
  > & {
    style?: CSSProperties;
    helperText?: string;
    isBottomSpace?: boolean;
    options: Array<OptionHTMLAttributes<HTMLOptionElement>>;
  };

const UseNormalizeValue = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  name: string,
  field: Pick<ControllerRenderProps<TFieldValues, TName>, 'value' | 'onChange'>,
  defaultValues?: Readonly<DeepPartial<TFieldValues>>
) =>
  useCallback(() => {
    if (field.value === '' || field.value === undefined || field.value === null) {
      // If the value is empty, undefined, or null, set it to the default value if available
      if (defaultValues !== undefined) {
        field.onChange(defaultValues[name]);
      }
    }
  }, [name, field, defaultValues]);

const defaultStyle = 'bg-gray-50 text-gray-900 font-normal';
const baseStyle =
  'w-full h-full rounded-lg border p-2.5 text-sm cursor-pointer disabled:border-gray-300 disabled:bg-gray-400/50 disabled:text-black disabled:cursor-not-allowed';
const normalStyle = `${baseStyle} ${defaultStyle} bg-gray-50/60 border-gray-300 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;

function _SelectRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: SelectRHFProps<TFieldValues, TName>) {
  const selectFieldProps = omit(props, [
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
      render={({
        field,
        fieldState: { isTouched, isDirty, invalid, error },
        formState: { defaultValues },
      }) => {
        const [selectWidth, setSelectWidth] = useState(0);
        const selectCallback = useCallback((node: HTMLSelectElement | null) => {
          if (node) {
            const width = node.getBoundingClientRect().width;
            setSelectWidth((prev) => (prev !== width ? width : prev));
          }
          field.ref(node);
        }, []);
        const isError = props.disabled || ((isTouched || isDirty) && invalid);
        const selectedOption = useMemo(
          () => props.options.find((option) => option.value === field.value),
          [props.options, field.value]
        );
        const selectClassName = useMemo(() => {
          const className = isError ? errorStyle : normalStyle;
          if (selectedOption !== undefined && selectedOption.className !== undefined) {
            return `${className} ${selectedOption.className}`;
          } else {
            return className;
          }
        }, [selectedOption, isError]);
        const selectStyle = useMemo(() => {
          if (selectedOption !== undefined && selectedOption.style !== undefined) {
            return selectedOption.style;
          } else {
            return undefined;
          }
        }, [selectedOption]);
        const normalizeValue = UseNormalizeValue<TFieldValues, TName>(
          props.name,
          pick(field, ['value', 'onChange']),
          defaultValues
        );

        useLayoutEffect(() => {
          normalizeValue();
        }, [defaultValues]);

        return (
          <ul style={props.style} className={`w-fit min-w-[200px] ${props.className}`}>
            <li>
              <select
                className={selectClassName}
                style={selectStyle}
                {...field}
                {...selectFieldProps}
                ref={selectCallback}
              >
                {props.options.map((option, index) => {
                  const optionClassName =
                    option.className !== undefined && option.className !== ''
                      ? `${defaultStyle} ${option.className}`
                      : defaultStyle;
                  return (
                    <option
                      key={`${index}-${option.value}`}
                      {...option}
                      className={optionClassName}
                    />
                  );
                })}
              </select>
            </li>
            {(props.helperText || props.isBottomSpace || isError) && (
              <HelperText
                style={{ maxWidth: `${selectWidth}px` }}
                isError={isError}
                error={error}
                helperText={props.helperText}
                isBottomSpace={props.isBottomSpace}
              />
            )}
          </ul>
        );
      }}
    />
  );
}

export const SelectRHF = memo(_SelectRHF, (oldProps, newProps) =>
  isEqual(oldProps, newProps)
) as typeof _SelectRHF;
