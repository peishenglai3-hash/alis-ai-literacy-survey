/**
 * AI协作风格对比条形图组件（React版）
 *
 * 文件：components/StyleComparisonBarChart.jsx
 *
 * 功能：
 * - 显示3个维度对的对比条形图（E vs U、T vs V、F vs R）
 * - 显示百分比（MBTI风格）
 * - 显示倾向强度
 * - 避免优劣暗示
 */

import React from 'react';

const StyleComparisonBarChart = ({ styleProfile }) => {
  /**
   * 计算百分比
   * @param {number} score - 原始分数（1-7）
   * @returns {number} - 百分比（0-100）
   */
  const calculatePercent = (score) => {
    return Math.round((score / 7) * 100);
  };

  /**
   * 计算倾向强度
   * @param {number} positiveScore - 正端分数
   * @param {number} negativeScore - 负端分数
   * @returns {number} - 倾向强度（-100到100）
   */
  const calculateBias = (positiveScore, negativeScore) => {
    return Math.round(((positiveScore - negativeScore) / 7) * 100);
  };

  /**
   * 获取维度对的完整数据
   * @param {object} dimension - 维度数据
   * @returns {object} - 包含百分比、倾向强度等
   */
  const getDimensionData = (dimension) => {
    const ends = dimension.name.split('-');
    const positiveEnd = ends[0];
    const negativeEnd = ends[1];

    const positiveScore = dimension.scores[positiveEnd.toLowerCase()];
    const negativeScore = dimension.scores[negativeEnd.toLowerCase()];

    const positivePercent = calculatePercent(positiveScore);
    const negativePercent = calculatePercent(negativeScore);
    const bias = calculateBias(positiveScore, negativeScore);
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
  };

  /**
   * 渲染单个维度条形图
   */
  const renderDimensionBar = (dimension, index) => {
    const data = getDimensionData(dimension);

    return (
      <div key={index} className="dimension-bar-container">
        {/* 维度标题 */}
        <div className="dimension-header">
          <span className="dimension-number">{index + 1}️⃣</span>
          <span className="dimension-title">
            {data.position} {data.position === data.positiveEnd ? data.positivePercent : data.negativePercent}%
          </span>
        </div>

        {/* 正端条形图 */}
        <div className="bar-wrapper">
          <div className="bar-label">
            {data.positiveEnd} {data.positivePercent}%
          </div>
          <div className="bar-container">
            <div
              className={`bar bar-positive ${data.position === data.positiveEnd ? 'bar-dominant' : ''}`}
              style={{ width: `${data.positivePercent}%` }}
            >
              {data.positivePercent >= 15 && (
                <span className="bar-marker">●</span>
              )}
            </div>
            <span className="bar-score">{data.positiveScore}/7</span>
          </div>
        </div>

        {/* vs 连接 */}
        <div className="vs-connector">vs</div>

        {/* 负端条形图 */}
        <div className="bar-wrapper">
          <div className="bar-label">
            {data.negativeEnd} {data.negativePercent}%
          </div>
          <div className="bar-container">
            <div
              className={`bar bar-negative ${data.position === data.negativeEnd ? 'bar-dominant' : ''}`}
              style={{ width: `${data.negativePercent}%` }}
            >
              {data.negativePercent >= 15 && (
                <span className="bar-marker">●</span>
              )}
            </div>
            <span className="bar-score">{data.negativeScore}/7</span>
          </div>
        </div>

        {/* 倾向强度说明 */}
        <div className="bias-description">
          你{data.biasText}
        </div>

        {/* 维度描述 */}
        <div className="dimension-description">
          "{dimension.description}"
        </div>

        {/* 分隔线 */}
        {index < 2 && <div className="dimension-divider" />}
      </div>
    );
  };

  /**
   * 渲染类型代码头部
   */
  const renderTypeHeader = () => {
    const dimensions = styleProfile.dimensions;
    const euData = getDimensionData(dimensions[0]);
    const tvData = getDimensionData(dimensions[1]);
    const frData = getDimensionData(dimensions[2]);

    const typeCode = styleProfile.type_code;
    const dominantPercents = [
      euData.position === euData.positiveEnd ? euData.positivePercent : euData.negativePercent,
      tvData.position === tvData.positiveEnd ? tvData.positivePercent : tvData.negativePercent,
      frData.position === frData.positiveEnd ? frData.positivePercent : frData.negativePercent
    ];

    const dominantEnds = [
      euData.position,
      tvData.position,
      frData.position
    ];

    return (
      <div className="type-header">
        <div className="type-code-title">
          🎭 你的类型：{styleProfile.full_name}
        </div>
        <div className="type-code-summary">
          {typeCode} | {dominantEnds[0]} {dominantPercents[0]}%
          · {dominantEnds[1]} {dominantPercents[1]}%
          · {dominantEnds[2]} {dominantPercents[2]}%
        </div>
        <div className="type-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
      </div>
    );
  };

  return (
    <div className="style-comparison-bar-chart">
      {/* 类型头部 */}
      {renderTypeHeader()}

      {/* 3个维度条形图 */}
      <div className="dimensions-container">
        {styleProfile.dimensions.map((dimension, index) =>
          renderDimensionBar(dimension, index)
        )}
      </div>

      {/* 底部说明 */}
      <div className="chart-footer">
        <div className="characteristics">
          <div className="section-title">💡 你的特点：</div>
          <ul>
            {styleProfile.characteristics.map((char, index) => (
              <li key={index}>{char}</li>
            ))}
          </ul>
        </div>

        <div className="dimension-details">
          <div className="section-title">🧾 维度详情：</div>
          <ul>
            {styleProfile.dimensions.map((dim, index) => {
              const data = getDimensionData(dim);
              return (
                <li key={index}>
                  • {data.positiveEnd}-{data.negativeEnd}：
                  {data.positivePercent}% vs {data.negativePercent}%
                  （偏向{data.position}，差距{Math.abs(data.bias)}%）
                </li>
              );
            })}
          </ul>
        </div>

        <div className="type-explanation">
          <div className="section-title">🧭 为什么是{styleProfile.type_code}？</div>
          <ul>
            {styleProfile.dimensions.map((dim, index) => {
              const data = getDimensionData(dim);
              const dominantCode = data.position === data.positiveEnd
                ? data.positiveEnd[0]
                : data.negativeEnd[0];
              return (
                <li key={index}>
                  • {data.position}({data.position === data.positiveEnd
                    ? data.positivePercent
                    : data.negativePercent}%) > {data.position === data.positiveEnd
                    ? data.negativeEnd
                    : data.positiveEnd}({data.position === data.positiveEnd
                    ? data.negativePercent
                    : data.positivePercent}%) → {dominantCode}
                </li>
              );
            })}
            <li>• 组合：{styleProfile.type_code} = {styleProfile.full_name}</li>
          </ul>
        </div>

        <div className="value-statement">
          <div className="section-title">⚠️ 重要说明：</div>
          <p>每种协作风格都值得研究，无优劣之分</p>
          <p>百分比仅表示倾向强度，不代表能力强弱</p>
        </div>
      </div>
    </div>
  );
};

export default StyleComparisonBarChart;
