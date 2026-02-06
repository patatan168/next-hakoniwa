import { isEqual, omit } from 'es-toolkit';
import {
  CSSProperties,
  InputHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { FaMinus, FaPlus } from 'react-icons/fa6';
import styleCss from './style/RangeSliderRHF.module.scss';

type RangeSliderRHFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, 'render'> &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onBlur' | 'value' | 'disabled' | 'name' | 'inputRef' | 'type'
  > & {
    digits?: number | string;
    helperText?: string;
    isBottomSpace?: boolean;
  };

const getTextFieldProps = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: RangeSliderRHFProps<TFieldValues, TName>
) =>
  omit(props, [
    'min',
    'max',
    'digits',
    'className',
    'control',
    'rules',
    'style',
    'shouldUnregister',
    'helperText',
    'isBottomSpace',
  ]);

const UlStyle = (propsStyle: CSSProperties | undefined) =>
  useMemo(() => {
    const baseWidth = { width: '270px' };
    const uiStyle =
      propsStyle !== undefined && propsStyle.width !== undefined
        ? propsStyle
        : { ...propsStyle, ...baseWidth };

    return uiStyle;
  }, [propsStyle]);

const plusMinusButtonStyle =
  'inline-flex items-center justify-center rounded-full hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300';

const UseNormalizeValue = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  name: string,
  field: Pick<ControllerRenderProps<TFieldValues, TName>, 'value' | 'onChange'>,
  min: string | number,
  max: string | number,
  digits: string | number,
  defaultValues?: Readonly<DeepPartial<TFieldValues>>
) =>
  useCallback(() => {
    if (field.value === '' || field.value === undefined || field.value === null) {
      // If the value is empty, undefined, or null, set it to the default value if available
      if (defaultValues !== undefined) {
        field.onChange(defaultValues[name]);
      }
    } else if (field.value < Number(min)) {
      field.onChange(Number(min));
    } else if (field.value > Number(max)) {
      field.onChange(Number(max));
    } else {
      // If the value is within the range, ensure it has the correct number of decimal places
      const decimalLength = String(field.value).includes('.')
        ? String(field.value).split('.')[1].length
        : 0;
      if (decimalLength > Number(digits)) {
        field.onChange(Number(field.value).toFixed(Number(digits)));
      }
    }
  }, [field.value, field.onChange, min, max, digits, name, defaultValues]);

const UseEffectNormalizeType = (
  value: string | number,
  onChange: (val: string | number) => void,
  defaultValue?: string | number
) => {
  const prevNormalizedRef = useRef<string | number>(null);

  useEffect(() => {
    const fallback = defaultValue ?? 0;
    const rawValue = value ?? '';
    const num = !isNaN(Number(rawValue)) ? Number(rawValue) : Number(fallback);
    let normalized: string | number = num;
    // NOTE: 初期値が文字列型なら変更する
    if (typeof fallback === 'string') {
      normalized = String(normalized);
    }

    if (prevNormalizedRef.current !== normalized) {
      prevNormalizedRef.current = normalized;
      onChange(normalized);
    }
  }, [value, defaultValue, onChange]);
};

const InputStyle = (error: boolean) =>
  useMemo(() => {
    const baseStyle =
      'rounded-lg border p-2.5 text-sm disabled:border-gray-300 disabled:bg-gray-400/50 disabled:text-black disabled:cursor-not-allowed';
    const defStyle = `${baseStyle} border-gray-300 bg-gray-50/50 text-gray-900 hover:border-green-500 focus:outline-hidden focus:ring-2 focus:ring-green-300`;
    const errorStyle = `${baseStyle} border-red-300 bg-red-50/70 text-red-900 hover:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-300`;

    if (error) {
      return errorStyle;
    } else {
      return defStyle;
    }
  }, [error]);

const RangeStyle = (error: boolean) =>
  useMemo(() => {
    if (error) {
      return styleCss['range-slider-error'];
    } else {
      return styleCss['range-slider'];
    }
  }, [error]);

const InputWidth = (min: number | string, max: number | string, digits: number | string) =>
  useMemo(() => {
    const minLength = `${min}`.length;
    const maxLength = `${max}`.length;
    const digitsNumber = typeof digits === 'number' ? digits : parseInt(digits, 10);
    const digitsLength = digitsNumber > 0 ? digitsNumber + 1 : 0;
    const length = Math.max(minLength, maxLength);
    return `${length + digitsLength + 2}em`;
  }, [min, max, digits]);

const HelperTextWidth = (rangeWidth: number) =>
  useMemo(() => {
    return { maxWidth: `${rangeWidth}px` };
  }, [rangeWidth]);

const HelperText = memo(
  function HelperText({
    style,
    isError,
    error,
    helperText,
    isBottomSpace,
  }: {
    style?: CSSProperties;
    isError: boolean;
    error?: FieldError;
    helperText?: string;
    isBottomSpace?: boolean;
  }) {
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

function _RangeSliderRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: RangeSliderRHFProps<TFieldValues, TName>) {
  const textFieldProps = getTextFieldProps<TFieldValues, TName>(props);
  const { min = 0, max = 100, digits = 0 } = props;
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
        fieldState: { isTouched, invalid, error },
        formState: { defaultValues },
      }) => {
        const isError = props.disabled || (isTouched && invalid);
        const step = props.step ? Number(props.step) : 1;
        const [rangeWidth, setRangeWidth] = useState(0);
        const rangeCallback = (node: HTMLDivElement) => {
          if (node !== null) {
            const { width } = node.getBoundingClientRect();
            setRangeWidth(width);
          }
        };
        UseEffectNormalizeType(field.value, field.onChange, props.defaultValue);

        const normalizeValue = UseNormalizeValue<TFieldValues, TName>(
          props.name,
          field,
          min,
          max,
          digits,
          defaultValues
        );

        const onBlur = useCallback(
          (_event: React.FocusEvent<HTMLInputElement>) => {
            normalizeValue();
            field.onBlur();
          },
          [normalizeValue]
        );

        return (
          <ul style={UlStyle(props.style)} className={`${props.className}`}>
            <li>
              <div
                className="grid place-items-center gap-1.5"
                style={{
                  gridTemplateColumns: 'auto 1fr auto auto',
                }}
                ref={rangeCallback}
              >
                <button
                  type="button"
                  className={plusMinusButtonStyle}
                  aria-label="Plus"
                  disabled={Number(field.value) <= Number(min)}
                  onClick={() => field.onChange(Math.max(Number(min), Number(field.value) - step))}
                >
                  <FaMinus className="text-xl" />
                </button>
                <input
                  type="range"
                  className={RangeStyle(isError)}
                  min={min}
                  max={max}
                  {...field}
                  {...textFieldProps}
                />
                <button
                  type="button"
                  className={plusMinusButtonStyle}
                  aria-label="Plus"
                  disabled={Number(field.value) >= Number(max)}
                  onClick={() => field.onChange(Math.min(Number(max), Number(field.value) + step))}
                >
                  <FaPlus className="text-xl" />
                </button>
                <input
                  type="number"
                  style={{
                    maxWidth: InputWidth(min, max, digits),
                  }}
                  className={InputStyle(isError)}
                  min={min}
                  max={max}
                  {...field}
                  {...textFieldProps}
                  onBlur={onBlur}
                  ref={field.ref}
                />
              </div>
            </li>
            <HelperText
              style={HelperTextWidth(rangeWidth)}
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

export const RangeSliderRHF = memo(_RangeSliderRHF, (oldProps, newProps) =>
  isEqual(oldProps, newProps)
) as typeof _RangeSliderRHF;
