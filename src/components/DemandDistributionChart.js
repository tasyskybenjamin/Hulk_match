import React from 'react';
import ReactECharts from 'echarts-for-react';

const DemandDistributionChart = ({ data, distributionBy, showRoomDetail }) => {
  if (!data || data.length === 0) {
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

  // 根据分布维度生成不同的配置
  const getChartOption = () => {
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96'];

    if (distributionBy === 'region') {
      // 地域分布 - 饼图
      return {
        title: {
          text: distributionBy === 'region' && showRoomDetail ? '需求机房分布' : '需求地域分布',
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '需求量',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data.map((item, index) => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: colors[index % colors.length]
              }
            }))
          }
        ]
      };
    } else {
      // 渠道/状态分布 - 柱状图
      return {
        title: {
          text: distributionBy === 'channel' ? '需求渠道分布' : '需求状态分布',
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const param = params[0];
            const value = (param.value !== null && param.value !== undefined) ? param.value.toLocaleString() : '无数据';
            const percentage = param.data.percentage || 0;
            return `${param.name}<br/>${param.seriesName}: ${value}<br/>占比: ${percentage}%`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name),
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            rotate: data.length > 5 ? 45 : 0
          }
        },
        yAxis: {
          type: 'value',
          name: '需求量'
        },
        series: [
          {
            name: '需求量',
            type: 'bar',
            barWidth: '60%',
            data: data.map((item, index) => ({
              value: item.value,
              percentage: item.percentage,
              itemStyle: {
                color: colors[index % colors.length]
              }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
    }
  };

  const onChartClick = (params) => {
    console.log('点击了:', params.name, '需求量:', params.value);
    // 这里可以添加跳转到详情页面的逻辑
  };

  return (
    <ReactECharts
      option={getChartOption()}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px'
      }}
      onEvents={{
        click: onChartClick
      }}
    />
  );
};

export default DemandDistributionChart;
