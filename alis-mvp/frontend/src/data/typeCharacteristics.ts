// 8类型 characteristics 数据（v3.2 726反馈——任务5 结果页简化）。
// 来源：C:\Users\35636\Downloads\726反馈\议程1_界面简化_结果页.md

export interface TypeCharacteristics {
  animalDescription: string;
  memeDescription: string;
  characteristics: string[];
  valueNote: string;
}

const TYPE_CHARACTERISTICS: Record<string, TypeCharacteristics> = {
  ETF: {
    animalDescription: "总是第一时间尝试新AI工具",
    memeDescription: "用AI提高摸鱼效率，主打一个实用",
    characteristics: [
      "主动探索AI的可能性",
      "信任AI，愿意协作调试",
      "注重效率和使用体验",
    ],
    valueNote: "摸鱼人和实干家都合理，只是风格不同",
  },
  ERF: {
    animalDescription: "对新AI工具保持谨慎好奇",
    memeDescription: "爱质疑，不轻易相信AI的输出",
    characteristics: [
      "主动探索但保持批判",
      "习惯验证AI的结果",
      "注重工具的实际功能",
    ],
    valueNote: "质疑党和信任派都合理，只是风格不同",
  },
  UTF: {
    animalDescription: "专注少数工具，深入了解",
    memeDescription: "AI是完成任务的好帮手",
    characteristics: [
      "任务导向使用AI",
      "信任成熟工具的输出",
      "注重稳定可靠的功能",
    ],
    valueNote: "工具人和探索者都合理，只是风格不同",
  },
  UVF: {
    animalDescription: "选择稳妥的AI工具",
    memeDescription: "保守使用，注重安全",
    characteristics: [
      "谨慎使用成熟工具",
      "习惯验证重要结果",
      "注重可控性和安全性",
    ],
    valueNote: "保守派和尝鲜派都合理，只是风格不同",
  },
  ETR: {
    animalDescription: "智慧地探索AI的边界",
    memeDescription: "喜欢思考AI的意义",
    characteristics: [
      "主动探索并反思AI",
      "信任但会深思熟虑",
      "注重AI对自身的影响",
    ],
    valueNote: "哲学家和实干家都合理，只是风格不同",
  },
  ERR: {
    animalDescription: "批判性地探索AI",
    memeDescription: "对AI保持深度质疑",
    characteristics: [
      "探索但不轻易接受",
      "习惯批判性验证",
      "注重反思AI的局限",
    ],
    valueNote: "批判家和拥护者都合理，只是风格不同",
  },
  UTR: {
    animalDescription: "脚踏实地使用并反思AI",
    memeDescription: "用AI做事，也想清楚为什么",
    characteristics: [
      "任务导向但保持反思",
      "信任成熟工具",
      "注重实践与思考并重",
    ],
    valueNote: "实干家和梦想家都合理，只是风格不同",
  },
  UVR: {
    animalDescription: "稳妥地使用并审视AI",
    memeDescription: "守成持重，不轻易改变",
    characteristics: [
      "谨慎使用成熟工具",
      "习惯验证和反思",
      "注重稳定和可控",
    ],
    valueNote: "老古董和新潮派都合理，只是风格不同",
  },
};

export function getTypeCharacteristics(typeCode: string): TypeCharacteristics | undefined {
  return TYPE_CHARACTERISTICS[typeCode];
}
