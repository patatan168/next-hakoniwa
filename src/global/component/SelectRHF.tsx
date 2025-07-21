import { isEqual, omit, pick } from 'es-toolkit';
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

const UlStyle = (propsStyle: CSSProperties | undefined) =>
  useMemo(() => {
    const baseWidth = { width: '200px' };
    const uiStyle =
      propsStyle !== undefined && propsStyle.width !== undefined
        ? propsStyle
        : { ...propsStyle, ...baseWidth };

    return uiStyle;
  }, [propsStyle]);

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

const HelperTextWidth = (selectWidth: number) =>
  useMemo(() => {
    return { maxWidth: `${selectWidth}px` };
  }, [selectWidth]);

const defaultStyle = 'bg-gray-50 text-gray-900 font-normal';

const selectStyle = (error: boolean) => {
  const baseStyle =
    'w-full h-full rounded-lg border p-2.5 text-sm cursor-pointer disabled:border-gray-300 disabled:bg-gray-400/50 disabled:text-black disabled:cursor-not-allowed';
  const normalStyle = `${baseStyle} ${defaultStyle} bg-gray-50/60 border-gray-300 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
  const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;

  if (error) {
    return errorStyle;
  } else {
    return normalStyle;
  }
};

/**
 * セレクトボックスのClassNameの取得
 * @param selectedOption 選択中のoption要素
 * @param disabled 無効か
 * @param isError エラーか
 * @returns セレクトボックスのClassName取得
 */
const GetSelectClassName = (
  selectedOption: OptionHTMLAttributes<HTMLOptionElement> | undefined,
  isError: boolean
) =>
  useMemo(() => {
    const className = selectStyle(isError);
    if (selectedOption !== undefined && selectedOption.className !== undefined) {
      return `${className} ${selectedOption.className}`;
    } else {
      return className;
    }
  }, [selectedOption, isError]);

/**
 * セレクトボックスのStyle要素の取得
 * @param selectedOption 選択中のoption要素
 * @param value 選択している値
 * @returns セレクトボックスのStyle要素取得
 */
const GetSelectStyle = (selectedOption: OptionHTMLAttributes<HTMLOptionElement> | undefined) =>
  useMemo(() => {
    if (selectedOption !== undefined && selectedOption.style !== undefined) {
      return selectedOption.style;
    } else {
      return undefined;
    }
  }, [selectedOption]);

const SelectOptions = memo(
  function SelectOptions({ options }: { options: OptionHTMLAttributes<HTMLOptionElement>[] }) {
    return (
      <>
        {options.map((option, index) => {
          const optionClassName =
            option.className !== undefined && option.className !== ''
              ? `${defaultStyle} ${option.className}`
              : defaultStyle;
          return (
            <option key={`${index}-${option.value}`} {...option} className={optionClassName} />
          );
        })}
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

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

function _SelectRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: SelectRHFProps<TFieldValues, TName>) {
  const selectFieldProps = omit(props, [
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
        const selectCallback = (node: HTMLSelectElement) => {
          if (node !== null) {
            const { width } = node.getBoundingClientRect();
            setSelectWidth(width);
          }
          field.ref(node);
        };
        const isError = props.disabled || ((isTouched || isDirty) && invalid);
        const selectedOption = useMemo(
          () => props.options.find((option) => option.value === field.value),
          [props.options, field.value]
        );
        const selectClassName = GetSelectClassName(selectedOption, isError);
        const selectStyle = GetSelectStyle(selectedOption);
        const normalizeValue = UseNormalizeValue<TFieldValues, TName>(
          props.name,
          pick(field, ['value', 'onChange']),
          defaultValues
        );

        useLayoutEffect(() => {
          normalizeValue();
        }, [defaultValues]);

        return (
          <ul style={UlStyle(props.style)} className={props.className}>
            <li>
              <select
                className={selectClassName}
                style={selectStyle}
                {...field}
                {...selectFieldProps}
                ref={selectCallback}
              >
                <SelectOptions options={props.options} />
              </select>
            </li>
            <HelperText
              style={HelperTextWidth(selectWidth)}
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

export const SelectRHF = memo(_SelectRHF, (oldProps, newProps) =>
  isEqual(oldProps, newProps)
) as typeof _SelectRHF;
