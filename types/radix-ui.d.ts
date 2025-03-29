declare module '@radix-ui/react-dropdown-menu' {
  import * as React from 'react';

  // 基本组件
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Group: React.FC<any>;
  export const Portal: React.FC<any>;
  export const Sub: React.FC<any>;
  export const RadioGroup: React.FC<any>;
  
  // 子触发器
  export const SubTrigger: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean } & React.RefAttributes<HTMLDivElement>
  >;
  
  // 子内容
  export const SubContent: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
  
  // 内容
  export const Content: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { 
      sideOffset?: number;
      align?: "start" | "center" | "end"; 
    } & React.RefAttributes<HTMLDivElement>
  >;
  
  // 菜单项
  export const Item: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean } & React.RefAttributes<HTMLDivElement>
  >;
  
  // 复选框菜单项
  export const CheckboxItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { checked?: boolean } & React.RefAttributes<HTMLDivElement>
  >;
  
  // 单选菜单项
  export const RadioItem: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
  
  // 标签
  export const Label: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean } & React.RefAttributes<HTMLDivElement>
  >;
  
  // 分隔符
  export const Separator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
  
  // 指示器
  export const ItemIndicator: React.FC<any>;
} 

declare module '@radix-ui/react-dialog' {
  import * as React from 'react';

  // 基本组件
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Portal: React.FC<any>;
  export const Close: React.FC<any>;
  
  // 遮罩层
  export const Overlay: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
  
  // 内容
  export const Content: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
  
  // 标题
  export const Title: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>
  >;
  
  // 描述
  export const Description: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >;
} 