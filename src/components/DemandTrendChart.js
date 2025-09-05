import React from 'react';
import ReactECharts from 'echarts-for-react';

const DemandTrendChart = ({ data, disableAnomalyClick = false }) => {
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

  // 生成异常点数据（模拟需求量级突增的点）
  const generateAnomalyPoints = () => {
    const anomalies = [];
    data.datasets[0]?.data?.forEach((point, index) => {
      // 模拟：如果某个点的值比前一个点增长超过50%，则认为是异常点
      if (index > 0 && point.value > data.datasets[0].data[index - 1].value * 1.5) {
        anomalies.push({
          coord: [data.labels[index], point.value],
          demandId: `demand_${index}`,
          demandName: `突增需求-${index}`
        });
      }
    });
    return anomalies;
  };

  const anomalyPoints = generateAnomalyPoints();

  const getChartOption = () => {
    return {
      title: {
        text: '需求变化趋势',
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
              result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString()} (${dataType})<br/>`;
            }
          });
          return result;
        }
      },
      legend: {
        data: data.datasets.map(dataset => dataset.label),
        top: 30,
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
            return value.split('-').slice(1).join('/'); // 显示MM/DD格式
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '需求量',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        // 为每个数据集创建两个系列：历史数据（实线）和预测数据（虚线）
        ...data.datasets.flatMap((dataset, datasetIndex) => {
          const historicalData = [];
          const forecastData = [];

          dataset.data.forEach((point, index) => {
            const isPast = todayIndex === -1 || index <= todayIndex;
            if (isPast) {
              historicalData.push(point.value);
              // 在NOW点也添加数据到预测系列，确保连贯
              if (index === todayIndex) {
                forecastData.push(point.value);
              } else {
                forecastData.push(null);
              }
            } else {
              // 在NOW点的下一个点也添加到历史数据，确保连贯
              if (index === todayIndex + 1) {
                historicalData.push(point.value);
              } else {
                historicalData.push(null);
              }
              forecastData.push(point.value);
            }
          });

          return [
            // 历史数据系列（实线）
            {
              name: dataset.label,
              type: 'line',
              data: historicalData,
              lineStyle: {
                color: dataset.color,
                width: 2,
                type: 'solid'
              },
              itemStyle: {
                color: dataset.color
              },
              symbol: 'circle',
              symbolSize: 4,
              smooth: true,
              connectNulls: false,
              // 只在第一个数据集中添加NOW线
              ...(datasetIndex === 0 && todayIndex !== -1 ? {
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
            },
            // 预测数据系列（虚线）
            {
              name: `${dataset.label}(预测)`,
              type: 'line',
              data: forecastData,
              lineStyle: {
                color: dataset.color,
                width: 2,
                type: 'dashed'
              },
              itemStyle: {
                color: dataset.color,
                opacity: 0.7
              },
              symbol: 'circle',
              symbolSize: 4,
              smooth: true,
              connectNulls: false,
              showInLegend: false // 不在图例中显示预测系列
            }
          ];
        }),
        // 异常点系列（仅在不禁用时显示）
        ...(disableAnomalyClick ? [] : [{
          name: '异常点',
          type: 'scatter',
          data: anomalyPoints.map(point => ({
            value: point.coord,
            demandId: point.demandId,
            demandName: point.demandName
          })),
          symbolSize: 15,
          itemStyle: {
            color: '#ff4d4f',
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 5,
            shadowColor: 'rgba(255, 77, 79, 0.5)'
          },
          label: {
            show: true,
            formatter: '⚠️',
            position: 'top',
            fontSize: 12
          },
          tooltip: {
            formatter: function(params) {
              const value = params.value[1];
              const displayValue = (value !== null && value !== undefined) ? value.toLocaleString() : '无数据';
              return `异常点<br/>时间: ${params.value[0]}<br/>需求量: ${displayValue}`;
            }
          }
        }])
      ]
    };
  };

  const onChartClick = (params) => {
    if (!disableAnomalyClick && params.seriesName === '异常点' && params.data.demandId) {
      console.log('点击异常点:', params.data.demandName, 'ID:', params.data.demandId);
      // 这里可以添加跳转到需求详情页面的逻辑
      // 例如：window.open(`/demand-detail/${params.data.demandId}`, '_blank');
    }
  };

  return (
    <ReactECharts
      option={getChartOption()}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px'
      }}
      onEvents={disableAnomalyClick ? {} : {
        click: onChartClick
      }}
    />
  );
};

export default DemandTrendChart;
