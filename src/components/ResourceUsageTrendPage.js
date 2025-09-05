import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag
} from 'antd';
import {
  LineChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import InventoryFilterPanel from './InventoryFilterPanel';
import InventoryUsageTrendChart from './InventoryUsageTrendChart';
import './InventoryManagementPage.css';
import './ResourceUsageTrendPage.css';

const ResourceUsageTrendPage = () => {
  const [filters, setFilters] = useState({
    dateRange: [
      dayjs().subtract(1, 'month').startOf('day'), // 开始日期 00:00:00
      dayjs().add(1, 'month').endOf('day').subtract(11, 'seconds') // 结束日期 23:59:49
    ],
    clusterCascader: [], // 级联选择器：集群组->专区->调用方
    regionCascader: [], // 地域级联选择器：地域->机房
    productType: [], // 产品类型多选：通用、经济、高性能
    inventoryUsage: ['business', 'platform', 'self-use', 'operation', 'emergency'] // 库存用途多选，默认全部
  });

  const [usageTrendData, setUsageTrendData] = useState({ labels: [], usageData: [] });
  const [loading, setLoading] = useState(false);

  // 生成库存使用趋势数据
  const generateUsageTrendData = (filterParams) => {
    const dates = [];
    const usageData = [];

    // 根据筛选条件生成集群/专区/调用方的使用数据
    let clusters = [
      { name: 'hulk-general/default/avatar', baseUsed: 2800, baseUnused: 1200, clusterGroup: 'hulk-general', specialZone: 'default', caller: 'avatar', region: 'beijing', productType: 'general', inventoryUsage: 'business' },
      { name: 'hulk-general/jinrong_hulk/avatarjinrong', baseUsed: 1800, baseUnused: 800, clusterGroup: 'hulk-general', specialZone: 'jinrong_hulk', caller: 'avatarjinrong', region: 'beijing', productType: 'high-performance', inventoryUsage: 'business' },
      { name: 'hulk-arm/default/hulk_arm', baseUsed: 1200, baseUnused: 600, clusterGroup: 'hulk-arm', specialZone: 'default', caller: 'hulk_arm', region: 'huailai', productType: 'economic', inventoryUsage: 'self-use' },
      { name: 'txserverless/default/policy_txserverless', baseUsed: 900, baseUnused: 400, clusterGroup: 'txserverless', specialZone: 'default', caller: 'policy_txserverless', region: 'shanghai', productType: 'general', inventoryUsage: 'platform' },
      { name: 'hulk-general/hulk_holiday/holiday', baseUsed: 700, baseUnused: 300, clusterGroup: 'hulk-general', specialZone: 'hulk_holiday', caller: 'holiday', region: 'beijing', productType: 'general', inventoryUsage: 'business' },
      { name: 'hulk-general/default/policy', baseUsed: 650, baseUnused: 350, clusterGroup: 'hulk-general', specialZone: 'default', caller: 'policy', region: 'shanghai', productType: 'general', inventoryUsage: 'platform' },
      { name: 'hulk-general/hulk_pool_buffer/buffer', baseUsed: 580, baseUnused: 220, clusterGroup: 'hulk-general', specialZone: 'hulk_pool_buffer', caller: 'buffer', region: 'beijing', productType: 'general', inventoryUsage: 'self-use' },
      { name: 'hulk-arm/default/hulk_arm_admin', baseUsed: 450, baseUnused: 250, clusterGroup: 'hulk-arm', specialZone: 'default', caller: 'hulk_arm_admin', region: 'huailai', productType: 'economic', inventoryUsage: 'self-use' }
    ];

    // 根据筛选条件过滤集群数据
    if (filterParams.clusterCascader && filterParams.clusterCascader.length > 0) {
      clusters = clusters.filter(cluster => {
        return filterParams.clusterCascader.some(cascader => {
          const [clusterGroup, specialZone, caller] = cascader;
          return (!clusterGroup || cluster.clusterGroup === clusterGroup) &&
                 (!specialZone || cluster.specialZone === specialZone) &&
                 (!caller || cluster.caller === caller);
        });
      });
    }

    // 根据地域/机房筛选
    if (filterParams.regionCascader && filterParams.regionCascader.length > 0) {
      clusters = clusters.filter(cluster => {
        return filterParams.regionCascader.some(cascader => {
          const [region] = cascader;
          return cluster.region === region;
        });
      });
    }

    // 根据产品类型筛选
    if (filterParams.productType && filterParams.productType.length > 0) {
      clusters = clusters.filter(cluster => {
        return filterParams.productType.includes(cluster.productType);
      });
    }

    // 根据库存用途筛选
    if (filterParams.inventoryUsage && filterParams.inventoryUsage.length > 0) {
      clusters = clusters.filter(cluster => {
        return filterParams.inventoryUsage.includes(cluster.inventoryUsage);
      });
    }

    // 如果筛选后没有数据，显示默认的几个集群
    if (clusters.length === 0) {
      clusters = [
        { name: 'hulk-general/default/avatar', baseUsed: 2800, baseUnused: 1200 },
        { name: 'hulk-general/jinrong_hulk/avatarjinrong', baseUsed: 1800, baseUnused: 800 },
        { name: 'hulk-arm/default/hulk_arm', baseUsed: 1200, baseUnused: 600 }
      ];
    }

    // 根据时间范围生成日期数组
    const dateRange = filterParams.dateRange || filters.dateRange;
    const startDate = dateRange[0];
    const endDate = dateRange[1];

    let currentDate = startDate.clone();
    while (currentDate.valueOf() <= endDate.valueOf()) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }

    // 为每个集群生成使用趋势数据
    clusters.forEach((cluster, clusterIndex) => {
      const usedData = [];
      const unusedData = [];

      dates.forEach((dateStr, dateIndex) => {
        const date = dayjs(dateStr);
        const today = dayjs();
        const isPast = date.valueOf() <= today.valueOf();

        // 添加季节性波动和趋势
        const seasonalFactor = 1 + 0.1 * Math.sin((dateIndex + 30) * Math.PI / 30);
        const trendFactor = isPast ? 1 : 1 + Math.abs(dateIndex - dates.length/2) * 0.005;
        const randomFactor = 0.9 + Math.random() * 0.2;

        // 已使用数据：呈上升趋势
        const usedValue = Math.round(
          cluster.baseUsed * seasonalFactor * trendFactor * randomFactor *
          (isPast ? 1 : 1 + (dateIndex - dates.length/2) * 0.01)
        );

        // 未使用数据：相对稳定，略有下降
        const unusedValue = Math.round(
          cluster.baseUnused * seasonalFactor * randomFactor *
          (isPast ? 1 : 1 - (dateIndex - dates.length/2) * 0.005)
        );

        usedData.push({
          value: Math.max(0, usedValue),
          isPast
        });

        unusedData.push({
          value: Math.max(0, unusedValue),
          isPast
        });
      });

      usageData.push({
        name: cluster.name,
        used: usedData,
        unused: unusedData
      });
    });

    return {
      labels: dates,
      usageData: usageData
    };
  };

  // 获取数据
  const fetchUsageTrendData = async (filterParams) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟API调用

      // 生成库存使用趋势数据
      const usageTrend = generateUsageTrendData(filterParams);
      setUsageTrendData(usageTrend);
    } catch (error) {
      console.error('获取资源使用趋势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageTrendData(filters);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchUsageTrendData(newFilters);
  };

  return (
    <div className="resource-usage-trend-page" style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
             <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <LineChartOutlined style={{ color: '#1890ff' }} />
               资源使用趋势
             </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              展示各集群/专区/调用方的资源使用情况变化趋势，支持历史数据查看和未来预测
            </p>
          </div>
        </div>
      </Card>

      {/* 筛选面板 */}
      <Card className="filter-card" size="small" style={{ marginBottom: 16 }}>
        <InventoryFilterPanel
          filters={filters}
          onChange={handleFilterChange}
          loading={loading}
        />
      </Card>

      {/* 资源使用趋势图表 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>📈 资源使用趋势分析</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              flexWrap: 'wrap'
            }}>
              <Tag color="blue" size="small">实线：已使用</Tag>
              <Tag color="cyan" size="small">菱形：未使用</Tag>
              <Tag color="green" size="small">实线：历史数据</Tag>
              <Tag color="purple" size="small">虚线：预测数据</Tag>
            </div>
          </div>
        }
        extra={
          usageTrendData.usageData && usageTrendData.usageData.length > 0 && (
            <Tag color="processing" style={{ fontSize: '12px' }}>
              当前显示 {usageTrendData.usageData.length} 个集群
            </Tag>
          )
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ height: '500px', marginBottom: '16px' }}>
          <InventoryUsageTrendChart
            data={usageTrendData}
            filters={filters}
          />
         </div>
       </Card>
     </div>
   );
 };

 export default ResourceUsageTrendPage;
