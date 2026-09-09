// Question Pack 解析（纯函数，可测）。真源=后端 content/question_pack_v2.1.yaml。
// parsePack 接收原始 YAML 字符串，校验后返回 QuestionPack；
// 应用运行时用 bundledPack.ts 通过 Vite ?raw 注入该字符串（离线可用），
// 测试则用 Node fs 读同一份 YAML —— 逻辑与打包器解耦，两侧共用同一真源。
import yaml from "js-yaml";
import type { QuestionPack } from "../domain/pack";
import { validatePack } from "../domain/pack";

export function parsePack(raw: string): QuestionPack {
  const data = yaml.load(raw) as QuestionPack;
  validatePack(data); // 结构校验（15 题 / 7 维 / probe_tree 齐全）
  return data;
}
