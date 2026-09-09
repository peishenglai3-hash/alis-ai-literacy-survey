// 应用运行时的题库单例：通过 Vite ?raw 把后端 YAML 真源打进包（离线可用、无需网络）。
// ⚠️ 仅供应用代码 import；测试请用 pack-loader.parsePack + Node fs 读同一份 YAML。
import packRaw from "../../../backend/content/question_pack_v2.1.yaml?raw";
import { parsePack } from "./pack-loader";

export const bundledPack = parsePack(packRaw);
