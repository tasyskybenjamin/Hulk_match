import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Button, Space, Checkbox } from 'antd';
import dayjs from 'dayjs';

const InventoryUsageTrendChart = ({ data, filters }) => {
  const [selectedLegends, setSelectedLegends] = useState({});
  const [chartInstance, setChartInstance] = useState(null);

  // 初始化图例选择状态
  useEffect(() => {
    if (data && data.usageData) {
      const initialLegends = {};
      data.usageData.forEach(item => {
        initialLegends[`${item.name} - 已使用`] = true;
        initialLegends[`${item.name} - 未使用`] = true;
      });
      setSelectedLegends(initialLegends);
    }
  }, [data]);

  if (!data || !data.labels || !data.usageData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#999'
      }}>
        暂无数据
      </div>
    );
  }

  // 找到当前时间点的索引
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = data.labels.findIndex(label => label === today);

  // 全选功能
  const handleSelectAll = () => {
    const newLegends = {};
    data.usageData.forEach(item => {
      newLegends[`${item.name} - 已使用`] = true;
      newLegends[`${item.name} - 未使用`] = true;
    });
    setSelectedLegends(newLegends);

    // 更新图表
    if (chartInstance) {
      Object.keys(newLegends).forEach(name => {
        chartInstance.dispatchAction({
          type: 'legendSelect',
          name: name
        });
      });
    }
  };

  // 反选功能
  const handleInvertSelection = () => {
    const newLegends = {};
    data.usageData.forEach(item => {
      newLegends[`${item.name} - 已使用`] = !selectedLegends[`${item.name} - 已使用`];
      newLegends[`${item.name} - 未使用`] = !selectedLegends[`${item.name} - 未使用`];
    });
    setSelectedLegends(newLegends);

    // 更新图表
    if (chartInstance) {
      Object.keys(newLegends).forEach(name => {
        chartInstance.dispatchAction({
          type: newLegends[name] ? 'legendSelect' : 'legendUnSelect',
          name: name
        });
      });
    }
  };

  // 清空选择
  const handleClearAll = () => {
    const newLegends = {};
    data.usageData.forEach(item => {
      newLegends[`${item.name} - 已使用`] = false;
      newLegends[`${item.name} - 未使用`] = false;
    });
    setSelectedLegends(newLegends);

    // 更新图表
    if (chartInstance) {
      Object.keys(newLegends).forEach(name => {
        chartInstance.dispatchAction({
          type: 'legendUnSelect',
          name: name
        });
      });
    }
  };

  // 单个图例点击
  const handleLegendClick = (legendName) => {
    const newLegends = {
      ...selectedLegends,
      [legendName]: !selectedLegends[legendName]
    };
    setSelectedLegends(newLegends);

    // 更新图表
    if (chartInstance) {
      chartInstance.dispatchAction({
        type: newLegends[legendName] ? 'legendSelect' : 'legendUnSelect',
        name: legendName
      });
    }
  };

  const getChartOption = () => {
    const series = [];

    // 为每个集群/专区/调用方生成已使用和未使用的曲线
    data.usageData.forEach((item, index) => {
      const baseColor = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][index % 6];

      // 已使用曲线（实线）
      const usedHistoricalData = [];
      const usedForecastData = [];

      // 未使用曲线（实线）
      const unusedHistoricalData = [];
      const unusedForecastData = [];

      item.used.forEach((point, pointIndex) => {
        const isPast = todayIndex === -1 || pointIndex <= todayIndex;

        if (isPast) {
          usedHistoricalData.push(point.value);
          unusedHistoricalData.push(item.unused[pointIndex].value);

          // 在NOW点也添加数据到预测系列，确保连贯
          if (pointIndex === todayIndex) {
            usedForecastData.push(point.value);
            unusedForecastData.push(item.unused[pointIndex].value);
          } else {
            usedForecastData.push(null);
            unusedForecastData.push(null);
          }
        } else {
          // 在NOW点的下一个点也添加到历史数据，确保连贯
          if (pointIndex === todayIndex + 1) {
            usedHistoricalData.push(point.value);
            unusedHistoricalData.push(item.unused[pointIndex].value);
          } else {
            usedHistoricalData.push(null);
            unusedHistoricalData.push(null);
          }

          usedForecastData.push(point.value);
          unusedForecastData.push(item.unused[pointIndex].value);
        }
      });

      // 已使用历史数据系列
      if (usedHistoricalData.some(d => d !== null)) {
        series.push({
          name: `${item.name} - 已使用`,
          type: 'line',
          data: usedHistoricalData,
          lineStyle: {
            color: baseColor,
            width: 3,
            type: 'solid'
          },
          itemStyle: {
            color: baseColor
          },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          connectNulls: false,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: baseColor + '40'
              }, {
                offset: 1, color: baseColor + '10'
              }]
            }
          }
        });
      }

      // 已使用预测数据系列
      if (usedForecastData.some(d => d !== null)) {
        series.push({
          name: `${item.name} - 已使用`,
          type: 'line',
          data: usedForecastData,
          lineStyle: {
            color: baseColor,
            width: 3,
            type: 'dashed'
          },
          itemStyle: {
            color: baseColor,
            opacity: 0.7
          },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          connectNulls: false,
          showInLegend: false,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: baseColor + '20'
              }, {
                offset: 1, color: baseColor + '05'
              }]
            }
          }
        });
      }

      // 未使用历史数据系列
      const unusedColor = baseColor.replace('#', '#') + '80'; // 添加透明度
      if (unusedHistoricalData.some(d => d !== null)) {
        series.push({
          name: `${item.name} - 未使用`,
          type: 'line',
          data: unusedHistoricalData,
          lineStyle: {
            color: unusedColor,
            width: 2,
            type: 'solid'
          },
          itemStyle: {
            color: unusedColor
          },
          symbol: 'diamond',
          symbolSize: 5,
          smooth: true,
          connectNulls: false
        });
      }

      // 未使用预测数据系列
      if (unusedForecastData.some(d => d !== null)) {
        series.push({
          name: `${item.name} - 未使用`,
          type: 'line',
          data: unusedForecastData,
          lineStyle: {
            color: unusedColor,
            width: 2,
            type: 'dashed'
          },
          itemStyle: {
            color: unusedColor,
            opacity: 0.7
          },
          symbol: 'diamond',
          symbolSize: 5,
          smooth: true,
          connectNulls: false,
          showInLegend: false
        });
      }

      // 只在第一个数据集中添加NOW线
      if (index === 0 && todayIndex !== -1) {
        series.push({
          name: 'NOW线',
          type: 'line',
          showInLegend: false,
          markLine: {
            silent: true,
            lineStyle: {
              color: '#ff4d4f',
              width: 2,
              type: 'dashed'
            },
            label: {
              show: true,
              position: 'insideEndTop',
              formatter: 'NOW',
              color: '#ff4d4f',
              fontSize: 12,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: [2, 4],
              borderRadius: 3
            },
            data: [
              {
                xAxis: data.labels[todayIndex]
              }
            ]
          },
          data: []
        });
      }
    });

    return {
      title: {
        text: '库存使用趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach(param => {
            if (param.value !== null && param.value !== undefined) {
              const isPast = todayIndex === -1 || param.dataIndex <= todayIndex;
              const dataType = isPast ? '历史数据' : '预测数据';
              result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString()} 核 (${dataType})<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        show: false // 隐藏默认图例，使用自定义图例
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.labels,
        axisLabel: {
          formatter: function(value) {
            return dayjs(value).format('MM/DD');
          },
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '数量（核）',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: series
    };
  };

  // 获取图例数据
  const getLegendData = () => {
    const legends = [];
    data.usageData.forEach((item, index) => {
      const baseColor = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][index % 6];
      const unusedColor = baseColor + '80';

      legends.push({
        name: `${item.name} - 已使用`,
        color: baseColor,
        symbol: 'circle'
      });

      legends.push({
        name: `${item.name} - 未使用`,
        color: unusedColor,
        symbol: 'diamond'
      });
    });
    return legends;
  };

  const onChartReady = (chart) => {
    setChartInstance(chart);

    // 监听图例点击事件
    chart.on('legendselectchanged', (params) => {
      setSelectedLegends(params.selected);
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* 图表 */}
      <div style={{ height: 'calc(100% - 180px)' }}>
        <ReactECharts
          option={getChartOption()}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '350px'
          }}
          onChartReady={onChartReady}
        />
      </div>

      {/* 图例控制区域 */}
      <div style={{
        height: '180px',
        padding: '16px 0',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        {/* 控制按钮 */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <Space>
            <Button size="small" onClick={handleSelectAll}>
              全选
            </Button>
            <Button size="small" onClick={handleClearAll}>
              清空
            </Button>
            <Button size="small" onClick={handleInvertSelection}>
              反选
            </Button>
          </Space>
        </div>

        {/* 自定义图例 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px 12px',
          maxHeight: '120px',
          overflowY: 'auto',
          padding: '0 16px'
        }}>
          {getLegendData().map((legend) => (
            <div
              key={legend.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: selectedLegends[legend.name] ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                border: selectedLegends[legend.name] ? '1px solid #1890ff' : '1px solid transparent',
                opacity: selectedLegends[legend.name] ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onClick={() => handleLegendClick(legend.name)}
            >
              <Checkbox
                checked={selectedLegends[legend.name]}
                onChange={() => handleLegendClick(legend.name)}
                style={{ marginRight: '6px' }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: legend.color,
                  marginRight: '6px',
                  borderRadius: legend.symbol === 'circle' ? '50%' : '2px',
                  transform: legend.symbol === 'diamond' ? 'rotate(45deg)' : 'none'
                }}
              />
              <span style={{
                fontSize: '12px',
                color: selectedLegends[legend.name] ? '#333' : '#999',
                whiteSpace: 'nowrap'
              }}>
                {legend.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryUsageTrendChart;
