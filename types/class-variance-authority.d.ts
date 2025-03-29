declare module "class-variance-authority" {
  export type ClassValue = string | number | boolean | undefined | null | Record<string, any>;
  export type ClassProp = string | undefined;
  
  export interface VariantProps<Component extends (...args: any) => any> {
    [key: string]: any;
  }
  
  export function cva(
    base?: ClassValue,
    config?: {
      variants?: Record<string, Record<string, ClassValue>>;
      compoundVariants?: Array<Record<string, any> & { class?: ClassValue; className?: ClassValue }>;
      defaultVariants?: Record<string, string | boolean | number>;
    }
  ): (props?: Record<string, any>) => string;
} 