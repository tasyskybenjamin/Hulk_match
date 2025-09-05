import React from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const ResourceGapTrendChart = ({ data, activeTab = 'all', filters }) => {
  if (!data || !data.labels || !data.datasets) {
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

  const getChartOption = () => {
    // 根据activeTab决定显示哪些数据系列
    let seriesToShow = [];

    // 库存始终显示
    const inventory = data.datasets.find(d => d.key === 'inventory');

    if (activeTab === 'all') {
      // 显示总需求
      const totalDemand = data.datasets.find(d => d.key === 'totalDemand');
      seriesToShow = [inventory, totalDemand];
    } else if (activeTab === 'pending') {
      // 只显示待评估需求
      const pendingDemand = data.datasets.find(d => d.key === 'pendingDemand');
      seriesToShow = [inventory, pendingDemand];
    } else if (activeTab === 'confirmed') {
      // 只显示确认待交付需求
      const confirmedDemand = data.datasets.find(d => d.key === 'confirmedDemand');
      seriesToShow = [inventory, confirmedDemand];
    }

    const series = [];

    // 计算资源缺口数据
    const inventoryDataset = seriesToShow.find(d => d.key === 'inventory');
    const demandDataset = seriesToShow.find(d => d.key !== 'inventory');

    let gapHistoricalData = [];
    let gapForecastData = [];

    if (inventoryDataset && demandDataset) {
      inventoryDataset.data.forEach((inventoryPoint, index) => {
        const demandPoint = demandDataset.data[index];
        const isPast = todayIndex === -1 || index <= todayIndex;
        const gap = Math.max(0, demandPoint.value - inventoryPoint.value); // 缺口 = 需求 - 库存，最小为0

        if (isPast) {
          gapHistoricalData.push(gap);
          if (index === todayIndex) {
            gapForecastData.push(gap);
          } else {
            gapForecastData.push(null);
          }
        } else {
          if (index === todayIndex + 1) {
            gapHistoricalData.push(gap);
          } else {
            gapHistoricalData.push(null);
          }
          gapForecastData.push(gap);
        }
      });
    }

    // 添加资源缺口历史数据系列
    if (gapHistoricalData.some(d => d !== null)) {
      series.push({
        name: '资源缺口',
        type: 'line',
        data: gapHistoricalData,
        lineStyle: {
          color: '#ff4d4f',
          width: 3,
          type: 'solid'
        },
        itemStyle: {
          color: '#ff4d4f'
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
              offset: 0, color: '#ff4d4f60'
            }, {
              offset: 1, color: '#ff4d4f20'
            }]
          }
        },
        // 添加NOW线
        ...(todayIndex !== -1 ? {
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
          }
        } : {})
      });
    }

    // 添加资源缺口预测数据系列
    if (gapForecastData.some(d => d !== null)) {
      series.push({
        name: '资源缺口',
        type: 'line',
        data: gapForecastData,
        lineStyle: {
          color: '#ff4d4f',
          width: 3,
          type: 'dashed'
        },
        itemStyle: {
          color: '#ff4d4f',
          opacity: 0.7
        },
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        connectNulls: false,
        showInLegend: false, // 不在图例中显示预测系列
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: '#ff4d4f40'
            }, {
              offset: 1, color: '#ff4d4f10'
            }]
          }
        }
      });
    }

    // 如果没有缺口数据，显示零线
    if (series.length === 0) {
      const zeroData = data.labels.map(() => 0);
      series.push({
        name: '资源缺口',
        type: 'line',
        data: zeroData,
        lineStyle: {
          color: '#d9d9d9',
          width: 2,
          type: 'solid'
        },
        itemStyle: {
          color: '#d9d9d9'
        },
        symbol: 'none',
        smooth: true,
        areaStyle: {
          color: 'transparent'
        }
      });
    }

    return {
      title: {
        text: '资源缺口趋势',
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
              if (param.value > 0) {
                const isPast = todayIndex === -1 || param.dataIndex <= todayIndex;
                const dataType = isPast ? '历史数据' : '预测数据';
                result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString()} 核 (${dataType})<br/>`;
              } else {
                result += `${param.marker}${param.seriesName}: 无缺口<br/>`;
              }
            }
          });
          return result;
        }
      },
      legend: {
        data: ['资源缺口'],
        top: 35,
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
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
        name: '缺口数量（核）',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: series
    };
  };

  return (
    <ReactECharts
      option={getChartOption()}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px'
      }}
    />
  );
};

export default ResourceGapTrendChart;
