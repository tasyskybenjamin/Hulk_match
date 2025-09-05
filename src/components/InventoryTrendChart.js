import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InventoryTrendChart = ({ data }) => {
  if (!data) {
    return <div>暂无数据</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const displayValue = (value !== null && value !== undefined) ? value.toLocaleString() : '无数据';
            return `${context.dataset.label}: ${displayValue} 核`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '时间',
          font: {
            size: 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '库存量（核）',
          font: {
            size: 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.3
      }
    }
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: '存量可用配额可用库存',
        data: data.stockQuota,
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#52c41a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '存量物理机转化配额可用库存',
        data: data.stockMachine,
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#1890ff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '私有云供给转化配额可用库存',
        data: data.privateCloud,
        borderColor: '#722ed1',
        backgroundColor: 'rgba(114, 46, 209, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#722ed1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '公有云供给转化配额可用库存',
        data: data.publicCloud,
        borderColor: '#fa8c16',
        backgroundColor: 'rgba(250, 140, 22, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#fa8c16',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '其他方式转化配额可用库存',
        data: data.otherSupply,
        borderColor: '#eb2f96',
        backgroundColor: 'rgba(235, 47, 150, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#eb2f96',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: '总可用库存',
        data: data.totalInventory,
        borderColor: '#13c2c2',
        backgroundColor: 'rgba(19, 194, 194, 0.1)',
        fill: false,
        tension: 0.3,
        pointBackgroundColor: '#13c2c2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default InventoryTrendChart;
