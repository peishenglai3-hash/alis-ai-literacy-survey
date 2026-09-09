/// <reference types="vite/client" />

// YAML 作为原始字符串导入（Vite ?raw）。真源=后端 question_pack_v2.1.yaml。
declare module "*.yaml?raw" {
  const content: string;
  export default content;
}
