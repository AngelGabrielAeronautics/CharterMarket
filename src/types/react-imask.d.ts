declare module 'react-imask' {
  import { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';

  export interface IMaskInputProps {
    mask: string | RegExp | Array<string | RegExp>;
    definitions?: Record<string, RegExp>;
    value?: string;
    defaultValue?: string;
    onAccept?: (value: string) => void;
    onComplete?: (value: string) => void;
    inputRef?: React.Ref<HTMLInputElement>;
    overwrite?: boolean;
    [key: string]: any;
  }

  export const IMaskInput: ForwardRefExoticComponent<IMaskInputProps & RefAttributes<HTMLInputElement>>;
} 