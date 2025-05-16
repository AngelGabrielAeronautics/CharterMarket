declare module 'react-imask' {
  import { ComponentType, ForwardRefExoticComponent, RefAttributes, InputHTMLAttributes } from 'react';

  export interface IMaskInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
    mask: string | RegExp | Array<string | RegExp>;
    definitions?: Record<string, RegExp>;
    value?: string;
    defaultValue?: string;
    onAccept?: (value: string) => void;
    onComplete?: (value: string) => void;
    inputRef?: React.Ref<HTMLInputElement>;
    overwrite?: boolean;
  }

  export const IMaskInput: ForwardRefExoticComponent<IMaskInputProps & RefAttributes<HTMLInputElement>>;
} 