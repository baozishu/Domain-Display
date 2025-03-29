import 'react';

declare module 'react' {
  // 扩展React命名空间，添加缺少的类型
  
  // 添加React Hooks
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useState<T = undefined>(): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
  
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  
  // 添加事件类型
  export interface ChangeEvent<T = Element> {
    target: T;
    currentTarget: T;
  }
  
  // ElementRef类型
  export type ElementRef<T> = T extends React.ComponentType<any>
    ? React.ComponentType<T>['prototype']
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : unknown;

  // ComponentPropsWithoutRef类型
  export type ComponentPropsWithoutRef<T> = T extends React.ComponentType<infer P>
    ? P extends { ref?: infer R }
      ? Omit<P, 'ref'>
      : P
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<infer A, any>
      ? Omit<A, 'ref'>
      : never
    : never;
  
  // 确保forwardRef函数可用
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;
} 