// 这个文件帮助TypeScript找到React模块的类型声明
// 在tsconfig.json的include中已经包含了**/*.ts文件

declare module 'react' {
  export * from 'react';
  export default React;
} 