<!--
  AI协作风格对比条形图组件（Vue版）

  文件：components/StyleComparisonBarChart.vue

  功能：
  - 显示3个维度对的对比条形图（E vs U、T vs V、F vs R）
  - 显示百分比（MBTI风格）
  - 显示倾向强度
  - 避免优劣暗示

  使用方式：
  <StyleComparisonBarChart :style-profile="styleProfile" />
-->

<template>
  <div class="style-comparison-bar-chart">
    <!-- 类型头部 -->
    <div class="type-header">
      <div class="type-code-title">
        🎭 你的类型：{{ styleProfile.full_name }}
      </div>
      <div class="type-code-summary">
        {{ styleProfile.type_code }} |
        {{ euPosition }} {{ euDominantPercent }}% ·
        {{ tvPosition }} {{ tvDominantPercent }}% ·
        {{ frPosition }} {{ frDominantPercent }}%
      </div>
      <div class="type-divider">
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </div>
    </div>

    <!-- 3个维度条形图 -->
    <div class="dimensions-container">
      <div
        v-for="(dimension, index) in styleProfile.dimensions"
        :key="index"
        class="dimension-bar-container"
      >
        <!-- 维度标题 -->
        <div class="dimension-header">
          <span class="dimension-number">{{ index + 1 }}️⃣</span>
          <span class="dimension-title">
            {{ getDimensionData(dimension).position }}
            {{ getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd
              ? getDimensionData(dimension).positivePercent
              : getDimensionData(dimension).negativePercent }}%
          </span>
        </div>

        <!-- 正端条形图 -->
        <div class="bar-wrapper">
          <div class="bar-label">
            {{ getDimensionData(dimension).positiveEnd }}
            {{ getDimensionData(dimension).positivePercent }}%
          </div>
          <div class="bar-container">
            <div
              :class="[
                'bar',
                'bar-positive',
                { 'bar-dominant': getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd }
              ]"
              :style="{ width: getDimensionData(dimension).positivePercent + '%' }"
            >
              <span
                v-if="getDimensionData(dimension).positivePercent >= 15"
                class="bar-marker"
              >●</span>
            </div>
            <span class="bar-score">
              {{ getDimensionData(dimension).positiveScore }}/7
            </span>
          </div>
        </div>

        <!-- vs 连接 -->
        <div class="vs-connector">vs</div>

        <!-- 负端条形图 -->
        <div class="bar-wrapper">
          <div class="bar-label">
            {{ getDimensionData(dimension).negativeEnd }}
            {{ getDimensionData(dimension).negativePercent }}%
          </div>
          <div class="bar-container">
            <div
              :class="[
                'bar',
                'bar-negative',
                { 'bar-dominant': getDimensionData(dimension).position === getDimensionData(dimension).negativeEnd }
              ]"
              :style="{ width: getDimensionData(dimension).negativePercent + '%' }"
            >
              <span
                v-if="getDimensionData(dimension).negativePercent >= 15"
                class="bar-marker"
              >●</span>
            </div>
            <span class="bar-score">
              {{ getDimensionData(dimension).negativeScore }}/7
            </span>
          </div>
        </div>

        <!-- 倾向强度说明 -->
        <div class="bias-description">
          你{{ getDimensionData(dimension).biasText }}
        </div>

        <!-- 维度描述 -->
        <div class="dimension-description">
          "{{ dimension.description }}"
        </div>

        <!-- 分隔线 -->
        <div v-if="index < 2" class="dimension-divider" />
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="chart-footer">
      <div class="characteristics">
        <div class="section-title">💡 你的特点：</div>
        <ul>
          <li v-for="(char, index) in styleProfile.characteristics" :key="index">
            {{ char }}
          </li>
        </ul>
      </div>

      <div class="dimension-details">
        <div class="section-title">🧾 维度详情：</div>
        <ul>
          <li
            v-for="(dimension, index) in styleProfile.dimensions"
            :key="index"
          >
            • {{ getDimensionData(dimension).positiveEnd }}-{{ getDimensionData(dimension).negativeEnd }}：
            {{ getDimensionData(dimension).positivePercent }}% vs {{ getDimensionData(dimension).negativePercent }}%
            （偏向{{ getDimensionData(dimension).position }}，差距{{ Math.abs(getDimensionData(dimension).bias) }}%）
          </li>
        </ul>
      </div>

      <div class="type-explanation">
        <div class="section-title">🧭 为什么是{{ styleProfile.type_code }}？</div>
        <ul>
          <li
            v-for="(dimension, index) in styleProfile.dimensions"
            :key="'explanation-' + index"
          >
            • {{ getDimensionData(dimension).position }}({{
              getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd
                ? getDimensionData(dimension).positivePercent
                : getDimensionData(dimension).negativePercent
            }}%) > {{
              getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd
                ? getDimensionData(dimension).negativeEnd
                : getDimensionData(dimension).positiveEnd
            }}({{
              getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd
                ? getDimensionData(dimension).negativePercent
                : getDimensionData(dimension).positivePercent
            }}%) → {{
              getDimensionData(dimension).position === getDimensionData(dimension).positiveEnd
                ? getDimensionData(dimension).positiveEnd[0]
                : getDimensionData(dimension).negativeEnd[0]
            }}
          </li>
          <li>• 组合：{{ styleProfile.type_code }} = {{ styleProfile.full_name }}</li>
        </ul>
      </div>

      <div class="value-statement">
        <div class="section-title">⚠️ 重要说明：</div>
        <p>每种协作风格都值得研究，无优劣之分</p>
        <p>百分比仅表示倾向强度，不代表能力强弱</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StyleComparisonBarChart',

  props: {
    styleProfile: {
      type: Object,
      required: true
    }
  },

  computed: {
    /**
     * 维度1的占优端
     */
    euPosition() {
      return this.getDimensionData(this.styleProfile.dimensions[0]).position;
    },

    /**
     * 维度1的占优端百分比
     */
    euDominantPercent() {
      const data = this.getDimensionData(this.styleProfile.dimensions[0]);
      return data.position === data.positiveEnd
        ? data.positivePercent
        : data.negativePercent;
    },

    /**
     * 维度2的占优端
     */
    tvPosition() {
      return this.getDimensionData(this.styleProfile.dimensions[1]).position;
    },

    /**
     * 维度2的占优端百分比
     */
    tvDominantPercent() {
      const data = this.getDimensionData(this.styleProfile.dimensions[1]);
      return data.position === data.positiveEnd
        ? data.positivePercent
        : data.negativePercent;
    },

    /**
     * 维度3的占优端
     */
    frPosition() {
      return this.getDimensionData(this.styleProfile.dimensions[2]).position;
    },

    /**
     * 维度3的占优端百分比
     */
    frDominantPercent() {
      const data = this.getDimensionData(this.styleProfile.dimensions[2]);
      return data.position === data.positiveEnd
        ? data.positivePercent
        : data.negativePercent;
    }
  },

  methods: {
    /**
     * 计算百分比
     * @param {number} score - 原始分数（1-7）
     * @returns {number} - 百分比（0-100）
     */
    calculatePercent(score) {
      return Math.round((score / 7) * 100);
    },

    /**
     * 计算倾向强度
     * @param {number} positiveScore - 正端分数
     * @param {number} negativeScore - 负端分数
     * @returns {number} - 倾向强度（-100到100）
     */
    calculateBias(positiveScore, negativeScore) {
      return Math.round(((positiveScore - negativeScore) / 7) * 100);
    },

    /**
     * 获取维度对的完整数据
     * @param {object} dimension - 维度数据
     * @returns {object} - 包含百分比、倾向强度等
     */
    getDimensionData(dimension) {
      const ends = dimension.name.split('-');
      const positiveEnd = ends[0];
      const negativeEnd = ends[1];

      const positiveScore = dimension.scores[positiveEnd.toLowerCase()];
      const negativeScore = dimension.scores[negativeEnd.toLowerCase()];

      const positivePercent = this.calculatePercent(positiveScore);
      const negativePercent = this.calculatePercent(negativeScore);
      const bias = this.calculateBias(positiveScore, negativeScore);
      const position = bias > 0 ? positiveEnd : negativeEnd;

      return {
        positiveEnd,
        negativeEnd,
        positiveScore,
        negativeScore,
        positivePercent,
        negativePercent,
        bias,
        position,
        biasText: `偏向【${position}】端，倾向强度 ${Math.abs(bias)}%`
      };
    }
  }
};
</script>

<style scoped>
/* 主容器 */
.style-comparison-bar-chart {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 类型头部 */
.type-header {
  text-align: center;
  margin-bottom: 30px;
}

.type-code-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.type-code-summary {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

.type-divider {
  color: #ccc;
  font-size: 14px;
  margin: 10px 0;
}

/* 维度容器 */
.dimensions-container {
  margin-bottom: 30px;
}

.dimension-bar-container {
  margin-bottom: 25px;
}

/* 维度标题 */
.dimension-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dimension-number {
  font-size: 20px;
  margin-right: 8px;
}

.dimension-title {
  font-size: 18px;
  font-weight: 600;
}

/* 条形图容器 */
.bar-wrapper {
  margin: 8px 0;
}

.bar-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.bar-container {
  display: flex;
  align-items: center;
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

/* 条形图 */
.bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.bar-negative {
  background: linear-gradient(90deg, #2196F3, #64B5F6);
}

.bar-dominant {
  background: linear-gradient(90deg, #FF9800, #FFB74D);
}

.bar-marker {
  color: white;
  font-size: 16px;
}

.bar-score {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}

/* vs 连接 */
.vs-connector {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 5px 0;
  font-weight: 600;
}

/* 倾向强度说明 */
.bias-description {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
  font-weight: 500;
}

/* 维度描述 */
.dimension-description {
  font-size: 13px;
  color: #999;
  margin-top: 5px;
  font-style: italic;
}

/* 分隔线 */
.dimension-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 20px 0;
}

/* 底部说明 */
.chart-footer {
  border-top: 2px solid #e0e0e0;
  padding-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.characteristics ul,
.dimension-details ul,
.type-explanation ul {
  margin: 0 0 15px 20px;
  padding: 0;
}

.characteristics li,
.dimension-details li,
.type-explanation li {
  margin-bottom: 5px;
  color: #666;
}

.value-statement {
  background: #fff9e6;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  margin-top: 15px;
}

.value-statement p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .style-comparison-bar-chart {
    padding: 15px;
  }

  .type-code-title {
    font-size: 20px;
  }

  .type-code-summary {
    font-size: 14px;
  }

  .dimension-title {
    font-size: 16px;
  }

  .bar-container {
    height: 20px;
  }
}
</style>
