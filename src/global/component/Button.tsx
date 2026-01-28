import { isEqual } from 'es-toolkit';
import { ButtonHTMLAttributes, memo, useMemo } from 'react';
import { TailwindColor, TailwindSize } from '../define/utilityType';

const hoverColor: Record<TailwindColor, string> = {
  slate: 'hover:bg-slate-800',
  gray: 'hover:bg-gray-800',
  zinc: 'hover:bg-zinc-800',
  neutral: 'hover:bg-neutral-800',
  stone: 'hover:bg-stone-800',
  red: 'hover:bg-red-800',
  orange: 'hover:bg-orange-800',
  amber: 'hover:bg-amber-800',
  yellow: 'hover:bg-yellow-800',
  lime: 'hover:bg-lime-800',
  green: 'hover:bg-green-800',
  emerald: 'hover:bg-emerald-800',
  teal: 'hover:bg-teal-800',
  cyan: 'hover:bg-cyan-800',
  sky: 'hover:bg-sky-800',
  blue: 'hover:bg-blue-800',
  indigo: 'hover:bg-indigo-800',
  violet: 'hover:bg-violet-800',
  purple: 'hover:bg-purple-800',
  fuchsia: 'hover:bg-fuchsia-800',
  pink: 'hover:bg-pink-800',
  rose: 'hover:bg-rose-800',
};

const disabledBgColor: Record<TailwindColor, string> = {
  slate: 'disabled:bg-slate-300',
  gray: 'disabled:bg-gray-300',
  zinc: 'disabled:bg-zinc-300',
  neutral: 'disabled:bg-neutral-300',
  stone: 'disabled:bg-stone-300',
  red: 'disabled:bg-red-300',
  orange: 'disabled:bg-orange-300',
  amber: 'disabled:bg-amber-300',
  yellow: 'disabled:bg-yellow-300',
  lime: 'disabled:bg-lime-300',
  green: 'disabled:bg-green-300',
  emerald: 'disabled:bg-emerald-300',
  teal: 'disabled:bg-teal-300',
  cyan: 'disabled:bg-cyan-300',
  sky: 'disabled:bg-sky-300',
  blue: 'disabled:bg-blue-300',
  indigo: 'disabled:bg-indigo-300',
  violet: 'disabled:bg-violet-300',
  purple: 'disabled:bg-purple-300',
  fuchsia: 'disabled:bg-fuchsia-300',
  pink: 'disabled:bg-pink-300',
  rose: 'disabled:bg-rose-300',
};

const focusColor: Record<TailwindColor, string> = {
  slate: 'focus:ring-slate-300',
  gray: 'focus:ring-gray-300',
  zinc: 'focus:ring-zinc-300',
  neutral: 'focus:ring-neutral-300',
  stone: 'focus:ring-stone-300',
  red: 'focus:ring-red-300',
  orange: 'focus:ring-orange-300',
  amber: 'focus:ring-amber-300',
  yellow: 'focus:ring-yellow-300',
  lime: 'focus:ring-lime-300',
  green: 'focus:ring-green-300',
  emerald: 'focus:ring-emerald-300',
  teal: 'focus:ring-teal-300',
  cyan: 'focus:ring-cyan-300',
  sky: 'focus:ring-sky-300',
  blue: 'focus:ring-blue-300',
  indigo: 'focus:ring-indigo-300',
  violet: 'focus:ring-violet-300',
  purple: 'focus:ring-purple-300',
  fuchsia: 'focus:ring-fuchsia-300',
  pink: 'focus:ring-pink-300',
  rose: 'focus:ring-rose-300',
};

const bgColor: Record<TailwindColor, string> = {
  slate: 'bg-slate-700',
  gray: 'bg-gray-700',
  zinc: 'bg-zinc-700',
  neutral: 'bg-neutral-700',
  stone: 'bg-stone-700',
  red: 'bg-red-700',
  orange: 'bg-orange-700',
  amber: 'bg-amber-700',
  yellow: 'bg-yellow-700',
  lime: 'bg-lime-700',
  green: 'bg-green-700',
  emerald: 'bg-emerald-700',
  teal: 'bg-teal-700',
  cyan: 'bg-cyan-700',
  sky: 'bg-sky-700',
  blue: 'bg-blue-700',
  indigo: 'bg-indigo-700',
  violet: 'bg-violet-700',
  purple: 'bg-purple-700',
  fuchsia: 'bg-fuchsia-700',
  pink: 'bg-pink-700',
  rose: 'bg-rose-700',
};

const textColor: Record<TailwindColor, string> = {
  slate: 'text-slate-700',
  gray: 'text-gray-700',
  zinc: 'text-zinc-700',
  neutral: 'text-neutral-700',
  stone: 'text-stone-700',
  red: 'text-red-700',
  orange: 'text-orange-700',
  amber: 'text-amber-700',
  yellow: 'text-yellow-700',
  lime: 'text-lime-700',
  green: 'text-green-700',
  emerald: 'text-emerald-700',
  teal: 'text-teal-700',
  cyan: 'text-cyan-700',
  sky: 'text-sky-700',
  blue: 'text-blue-700',
  indigo: 'text-indigo-700',
  violet: 'text-violet-700',
  purple: 'text-purple-700',
  fuchsia: 'text-fuchsia-700',
  pink: 'text-pink-700',
  rose: 'text-rose-700',
};

const borderColor: Record<TailwindColor, string> = {
  slate: 'border-slate-700',
  gray: 'border-gray-700',
  zinc: 'border-zinc-700',
  neutral: 'border-neutral-700',
  stone: 'border-stone-700',
  red: 'border-red-700',
  orange: 'border-orange-700',
  amber: 'border-amber-700',
  yellow: 'border-yellow-700',
  lime: 'border-lime-700',
  green: 'border-green-700',
  emerald: 'border-emerald-700',
  teal: 'border-teal-700',
  cyan: 'border-cyan-700',
  sky: 'border-sky-700',
  blue: 'border-blue-700',
  indigo: 'border-indigo-700',
  violet: 'border-violet-700',
  purple: 'border-purple-700',
  fuchsia: 'border-fuchsia-700',
  pink: 'border-pink-700',
  rose: 'border-rose-700',
};

const textSize: Record<TailwindSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
};

const commonStyle = (size: TailwindSize) =>
  `rounded-lg ${textSize[size]} md:px-5 px-3 py-2 cursor-pointer focus:ring-4 disabled:cursor-not-allowed`;

const primaryStyle = (color: TailwindColor) =>
  `${bgColor[color]} text-white font-semibold focus:outline-hidden`;

const outlineStyle = (color: TailwindColor) =>
  `${textColor[color]} bg-white hover:text-white border ${borderColor[color]} focus:outline-none font-semibold text-center disabled:bg-gray-400 disabled:text-white`;

const ButtonClassName = (
  className: string = '',
  color: TailwindColor = 'blue',
  category: 'primary' | 'outline' = 'primary',
  size: TailwindSize = 'sm'
) =>
  useMemo(() => {
    if (category === 'outline') {
      return `${commonStyle(size)} ${outlineStyle(color)} ${hoverColor[color]} ${focusColor[color]} ${className}`;
    } else {
      return `${commonStyle(size)} ${primaryStyle(color)} ${hoverColor[color]} ${disabledBgColor[color]} ${focusColor[color]} ${className}`;
    }
  }, [category, color, className, size]);

interface ButtonType extends ButtonHTMLAttributes<HTMLButtonElement> {
  icons?: React.ReactNode;
  color?: TailwindColor;
  category?: 'primary' | 'outline';
  size?: TailwindSize;
}

export default memo(
  function Button(props: ButtonType) {
    return (
      <button
        {...props}
        className={ButtonClassName(props.className, props.color, props.category, props.size)}
      >
        {props.icons ? (
          <div className="flex items-center justify-center">
            <div className="mr-2">{props.icons}</div>
            <div>{props.children}</div>
          </div>
        ) : (
          props.children
        )}
      </button>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
