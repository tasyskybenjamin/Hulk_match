import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
  Tabs,
  Cascader
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SupplyDemandTrendChart from './SupplyDemandTrendChart';
import ResourceGapTrendChart from './ResourceGapTrendChart';
import SupplyDemandSummary from './SupplyDemandSummary';
import './SupplyDemandMatchingPage.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SupplyDemandMatchingPage = ({ onNavigateToResourceProcurement }) => {
  const [filters, setFilters] = useState({
    dateRange: [
      dayjs().startOf('day'), // 当天开始 00:00:00
      dayjs().add(1, 'month').endOf('day').subtract(11, 'seconds') // 未来1个月结束 23:59:49
    ],
    clusterCascader: [], // 级联的集群组/专区/调用方选择
    region: [], // 地域/机房多选
    productType: [], // 产品类型多选
    demand: [] // 需求多选
  });

  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);

  // 级联选择器的数据结构：集群组 -> 专区 -> 调用方
  const clusterCascaderOptions = [
    {
      value: 'hulk-general',
      label: 'hulk-general',
      children: [
        {
          value: 'default',
          label: 'default',
          children: [
            { value: 'avatar', label: 'avatar' },
            { value: 'policy', label: 'policy' },
            { value: 'unit_4', label: 'unit_4' }
          ]
        },
        {
          value: 'hulk_pool_buffer',
          label: 'hulk_pool_buffer',
          children: [
            { value: 'avatar_reserved', label: 'avatar_reserved' },
            { value: 'migration', label: 'migration' }
          ]
        },
        {
          value: 'hulk_holiday',
          label: 'hulk_holiday',
          children: [
            { value: 'holiday', label: 'holiday' },
            { value: 'hulk_holiday_admin', label: 'hulk_holiday_admin' },
            { value: 'migrate_hulk_holiday', label: 'migrate_hulk_holiday' },
            { value: 'hulk_holiday', label: 'hulk_holiday' }
          ]
        },
        {
          value: 'jinrong_hulk',
          label: '金融专区',
          children: [
            { value: 'jinrong', label: 'jinrong' },
            { value: 'avatarjinrong', label: 'avatarjinrong' },
            { value: 'migrationjinrong', label: 'migrationjinrong' },
            { value: 'policy_jinrong_hulk', label: 'policy+jinrong_hulk' }
          ]
        },
        {
          value: 'huidu_hulk',
          label: '灰度专区',
          children: [
            { value: 'migration', label: 'migration' },
            { value: 'cargo', label: 'cargo' }
          ]
        },
        {
          value: 'hrs_non_zone_general',
          label: 'HRS视野内非专区部分',
          children: [
            { value: 'n_plus_one', label: 'n_plus_one' },
            { value: 'hdr', label: 'hdr' },
            { value: 'maoyan', label: 'maoyan' }
          ]
        }
      ]
    },
    {
      value: 'hulk-arm',
      label: 'hulk-arm',
      children: [
        {
          value: 'default',
          label: 'default',
          children: [
            { value: 'avatar', label: 'avatar' },
            { value: 'policy', label: 'policy' }
          ]
        },
        {
          value: 'hrs_non_zone_arm',
          label: 'HRS视野内非专区部分',
          children: [
            { value: 'hulk_arm_admin', label: 'hulk_arm_admin' },
            { value: 'hulk_arm', label: 'hulk_arm' },
            { value: 'migrate_hulk_arm', label: 'migrate_hulk_arm' }
          ]
        }
      ]
    },
    {
      value: 'txserverless',
      label: 'txserverless',
      children: [
        {
          value: 'default',
          label: 'default',
          children: [
            { value: 'avatar', label: 'avatar' },
            { value: 'policy', label: 'policy' }
          ]
        },
        {
          value: 'hrs_non_zone_serverless',
          label: 'HRS视野内非专区部分',
          children: [
            { value: 'policy_campaign_tx', label: 'policy_campaign_tx' },
            { value: 'policy_txserverless', label: 'policy+txserverless' },
            { value: 'txserverless_migration', label: 'txserverless_migration' }
          ]
        }
      ]
    }
  ];

  // 处理级联选择器变化
  const handleClusterCascaderChange = (value) => {
    setFilters(prev => ({
      ...prev,
      clusterCascader: value
    }));
  };

  // 地域/机房选项
  const regionOptions = [
    {
      label: '北京',
      value: 'beijing',
      children: [
        { label: 'Any', value: 'beijing-any' },
        { label: '机房1', value: 'beijing-room1' },
        { label: '机房2', value: 'beijing-room2' },
        { label: '机房3', value: 'beijing-room3' }
      ]
    },
    {
      label: '上海',
      value: 'shanghai',
      children: [
        { label: 'Any', value: 'shanghai-any' },
        { label: '机房1', value: 'shanghai-room1' },
        { label: '机房2', value: 'shanghai-room2' }
      ]
    },
    {
      label: '怀来',
      value: 'huailai',
      children: [
        { label: 'Any', value: 'huailai-any' },
        { label: '机房1', value: 'huailai-room1' }
      ]
    },
    {
      label: '其他',
      value: 'other',
      children: [
        { label: 'Any', value: 'other-any' }
      ]
    }
  ];

  // 产品类型选项
  const productTypeOptions = [
    { value: 'general', label: '通用' },
    { value: 'economic', label: '经济' },
    { value: 'high-performance', label: '高性能' }
  ];

  // 需求选项
  const demandOptions = [
    { value: 'daily', label: '日常需求' },
    { value: 'activity', label: '活动需求' },
    { value: 'emergency', label: '应急需求' },
    { value: 'special', label: '专项需求' },
    { value: 'resource-pool', label: '资源池需求' },
    { value: 'maintenance', label: '维护需求' },
    { value: 'expansion', label: '扩容需求' },
    { value: 'migration', label: '迁移需求' }
  ];

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 重置筛选条件
  const handleReset = () => {
    const resetFilters = {
      dateRange: [
        dayjs().startOf('day'), // 当天开始 00:00:00
        dayjs().add(1, 'month').endOf('day').subtract(11, 'seconds') // 未来1个月结束 23:59:49
      ],
      clusterCascader: [], // 默认不选中
      region: [],
      productType: [],
      demand: []
    };
    setFilters(resetFilters);
  };

  // 生成模拟趋势数据
  const generateTrendData = (filterParams = {}) => {
    const dates = [];
    const inventoryData = [];
    const totalDemandData = [];
    const pendingDemandData = [];
    const confirmedDemandData = [];

    // 根据筛选条件调整基础值
    let inventoryMultiplier = 1;
    let demandMultiplier = 1;

    // 集群组影响
    if (filterParams.clusterGroup && filterParams.clusterGroup.length > 0) {
      const clusterFactor = filterParams.clusterGroup.length / clusterGroupOptions.length;
      inventoryMultiplier *= clusterFactor;
      demandMultiplier *= clusterFactor;
    }

    // 地域影响
    if (filterParams.region && filterParams.region.length > 0) {
      const regionFactor = filterParams.region.length / 4; // 假设有4个主要地域
      inventoryMultiplier *= Math.max(0.3, regionFactor);
      demandMultiplier *= Math.max(0.3, regionFactor);
    }

    // 产品类型影响
    if (filterParams.productType && filterParams.productType.length > 0) {
      const productFactor = filterParams.productType.length / productTypeOptions.length;
      inventoryMultiplier *= Math.max(0.4, productFactor);
      demandMultiplier *= Math.max(0.4, productFactor);
    }

    // 基础值和趋势参数（应用筛选条件影响）- 十万量级虚拟化资源
    let availableInventoryBase = Math.round(80000 * inventoryMultiplier); // 8万核基础库存
    let deliveredInventoryBase = Math.round(20000 * inventoryMultiplier); // 2万核已交付库存
    let pendingBase = Math.round(5000 * demandMultiplier); // 5千核基础待评估需求
    let confirmedBase = Math.round(8000 * demandMultiplier); // 8千核基础确认待交付需求
    let deliveredDemandBase = Math.round(15000 * demandMultiplier); // 1.5万核已交付需求
    let totalDemandBase = Math.round(28000 * demandMultiplier); // 2.8万核总需求基础值

    // 根据用户选择的时间范围生成数据
    const startDate = filterParams.dateRange ? filterParams.dateRange[0] : dayjs().subtract(1, 'month');
    const endDate = filterParams.dateRange ? filterParams.dateRange[1] : dayjs().add(1, 'month');
    const today = dayjs();

    // 生成日期数组
    let currentDate = startDate.clone();
    while (currentDate.valueOf() <= endDate.valueOf()) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }

    // 为每个日期生成数据
    dates.forEach((dateStr, index) => {
      const date = dayjs(dateStr);
      const isPast = date.valueOf() <= today.valueOf();

      // 计算相对于今天的天数差
      const daysDiff = date.diff(today, 'day');

      // 添加季节性波动和长期趋势
      const seasonalFactor = 1 + 0.15 * Math.sin((index + 30) * Math.PI / 30);
      const trendFactor = isPast ? 1 : 1 + Math.abs(daysDiff) * 0.008;
      const randomFactor = 0.9 + Math.random() * 0.2;

      // 创建需求波动（包括高峰期和低谷期）
      let demandSpikeFactor = 1;
      const totalDays = dates.length;

      // 需求高峰期（模拟活动期间、节假日等）
      const peakStart = Math.floor(totalDays * 0.6); // 在60%的位置开始高峰
      const peakEnd = Math.floor(totalDays * 0.8); // 在80%的位置结束高峰

      // 需求低谷期（模拟业务淡季、维护期等）
      const lowStart = Math.floor(totalDays * 0.2); // 在20%的位置开始低谷
      const lowEnd = Math.floor(totalDays * 0.4); // 在40%的位置结束低谷

      if (index >= peakStart && index <= peakEnd) {
        // 高峰期需求增加2.0-3.5倍，达到十万量级峰值
        demandSpikeFactor = 2.0 + Math.sin((index - peakStart) / (peakEnd - peakStart) * Math.PI) * 1.5;
      } else if (index >= lowStart && index <= lowEnd) {
        // 低谷期需求减少到0.4-0.8倍
        demandSpikeFactor = 0.6 - Math.sin((index - lowStart) / (lowEnd - lowStart) * Math.PI) * 0.2;
      }

      // 创建库存波动（模拟供应链问题、维护等）
      let inventoryReductionFactor = 1;
      const inventoryIssueStart = Math.floor(totalDays * 0.4);
      const inventoryIssueEnd = Math.floor(totalDays * 0.7);

      // 库存充足期（模拟新设备到货、扩容等）
      const inventoryBoostStart = Math.floor(totalDays * 0.1);
      const inventoryBoostEnd = Math.floor(totalDays * 0.3);

      if (index >= inventoryIssueStart && index <= inventoryIssueEnd) {
        // 库存问题期间库存减少20-40%
        inventoryReductionFactor = 0.6 + Math.random() * 0.2;
      } else if (index >= inventoryBoostStart && index <= inventoryBoostEnd) {
        // 库存充足期间库存增加10-30%
        inventoryReductionFactor = 1.1 + Math.random() * 0.2;
      }

      if (isPast) {
        // 过去时间的处理

        // 总需求：过去时间 = 全部需求（历史实际需求）
        const totalDemandValue = Math.round(totalDemandBase * seasonalFactor * randomFactor);
        totalDemandData.push({
          value: totalDemandValue,
          isPast
        });
        totalDemandBase = totalDemandBase * 0.95 + totalDemandValue * 0.05;

        // 总需求对应的库存：过去时间 = 全部库存（已交付需求 + 可用库存）
        const availableValue = Math.round(availableInventoryBase * seasonalFactor * randomFactor);
        const deliveredValue = Math.round(deliveredInventoryBase * seasonalFactor * randomFactor);
        inventoryData.push({
          value: availableValue + deliveredValue,
          isPast
        });
        availableInventoryBase = availableInventoryBase * 0.95 + availableValue * 0.05;
        deliveredInventoryBase = deliveredInventoryBase * 0.95 + deliveredValue * 0.05;

        // 待评估需求：过去时间 = 0
        pendingDemandData.push({
          value: 0,
          isPast
        });

        // 确认待交付需求：过去时间 = 0
        confirmedDemandData.push({
          value: 0,
          isPast
        });
      } else {
        // 未来时间的处理

        // 待评估需求：未来时间 = 待评估需求
        const pendingValue = Math.round(pendingBase * (0.7 + Math.random() * 0.6) * trendFactor * demandSpikeFactor * (1 + Math.abs(daysDiff) * 0.02));
        pendingDemandData.push({
          value: pendingValue,
          isPast
        });
        pendingBase = pendingBase * 0.9 + pendingValue * 0.1;

        // 确认待交付需求：未来时间 = 确认待交付需求
        const confirmedValue = Math.round(confirmedBase * seasonalFactor * (0.8 + Math.random() * 0.4) * trendFactor * demandSpikeFactor * (1 + Math.abs(daysDiff) * 0.015));
        confirmedDemandData.push({
          value: confirmedValue,
          isPast
        });
        confirmedBase = confirmedBase * 0.9 + confirmedValue * 0.1;

        // 总需求：未来时间 = 全部需求（待评估 + 确认待交付）
        totalDemandData.push({
          value: pendingValue + confirmedValue,
          isPast
        });

        // 库存的处理根据不同的需求类型有所不同
        // 这里先计算基础的可用库存
        const availableValue = Math.round(availableInventoryBase * seasonalFactor * trendFactor * randomFactor * inventoryReductionFactor);

        // 总需求对应的库存：未来时间 = 全部库存
        inventoryData.push({
          value: availableValue,
          isPast
        });
        availableInventoryBase = availableInventoryBase * 0.95 + availableValue * 0.05;
      }
    });

    // 为不同需求类型生成对应的库存数据
    const pendingInventoryData = [];
    const confirmedInventoryData = [];

    dates.forEach((dateStr, index) => {
      const date = dayjs(dateStr);
      const isPast = date.valueOf() <= today.valueOf();

      if (isPast) {
        // 待评估需求对应的库存：过去时间 = 历史时刻可用库存
        const historicalAvailable = Math.round(availableInventoryBase * 0.8 * (0.9 + Math.random() * 0.2));
        pendingInventoryData.push({
          value: historicalAvailable,
          isPast
        });

        // 确认待交付需求对应的库存：过去时间 = 0
        confirmedInventoryData.push({
          value: 0,
          isPast
        });
      } else {
        // 待评估需求对应的库存：未来时间 = 可用库存
        const availableForPending = inventoryData[index].value;
        pendingInventoryData.push({
          value: availableForPending,
          isPast
        });

        // 确认待交付需求对应的库存：未来时间 = 可用库存 + 对应需求已出库部分库存
        const confirmedDemandValue = confirmedDemandData[index].value;
        const outboundForConfirmed = Math.round(confirmedDemandValue * 0.3); // 假设30%已出库
        confirmedInventoryData.push({
          value: availableForPending + outboundForConfirmed,
          isPast
        });
      }
    });

    return {
      labels: dates,
      datasets: [
        {
          key: 'inventory',
          label: '库存',
          data: inventoryData,
          color: '#52c41a'
        },
        {
          key: 'pendingInventory',
          label: '库存（待评估）',
          data: pendingInventoryData,
          color: '#52c41a'
        },
        {
          key: 'confirmedInventory',
          label: '库存（确认待交付）',
          data: confirmedInventoryData,
          color: '#52c41a'
        },
        {
          key: 'totalDemand',
          label: '总需求',
          data: totalDemandData,
          color: '#1890ff'
        },
        {
          key: 'pendingDemand',
          label: '待评估需求',
          data: pendingDemandData,
          color: '#faad14'
        },
        {
          key: 'confirmedDemand',
          label: '确认待交付需求',
          data: confirmedDemandData,
          color: '#f5222d'
        }
      ]
    };
  };

  // 查询数据
  const handleSearch = () => {
    setLoading(true);
    console.log('供需匹配查询参数:', filters);

    // 模拟API调用
    setTimeout(() => {
      const mockTrendData = generateTrendData(filters);
      setTrendData(mockTrendData);
      setLoading(false);
    }, 1000);
  };

  // 初始化数据
  useEffect(() => {
    const mockTrendData = generateTrendData(filters);
    setTrendData(mockTrendData);
  }, []);

  // 监听筛选条件变化，自动重新生成数据
  useEffect(() => {
    if (trendData) { // 只有在已有数据时才重新生成，避免重复初始化
      const mockTrendData = generateTrendData(filters);
      setTrendData(mockTrendData);
    }
  }, [filters.dateRange]);


  // 渲染地域选项
  const renderRegionOptions = () => {
    return regionOptions.map(region => (
      <Select.OptGroup key={region.value} label={region.label}>
        {region.children.map(child => (
          <Option key={child.value} value={child.value}>
            {child.label}
          </Option>
        ))}
      </Select.OptGroup>
    ));
  };

  return (
    <div className="supply-demand-matching-page">
      {/* 筛选面板 */}
      <Card className="filter-card" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          {/* 第一行：时间范围、集群组/专区、地域/机房、产品类型 */}
          <Col xs={24} sm={12} md={6}>
            <div className="filter-item">
              <label className="filter-label">时间范围：</label>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                placeholder={['开始日期', '结束日期']}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="filter-item">
              <label className="filter-label">集群组/专区：</label>
              <Cascader
                options={clusterCascaderOptions}
                value={filters.clusterCascader}
                onChange={handleClusterCascaderChange}
                placeholder="请选择集群组/专区"
                style={{ width: '100%' }}
                allowClear
                showSearch={{
                  filter: (inputValue, path) =>
                    path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                }}
                multiple
                maxTagCount="responsive"
                displayRender={(labels, selectedOptions) => {
                  if (labels.length === 0) return '';
                  return labels.join(' / ');
                }}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="filter-item">
              <label className="filter-label">地域/机房：</label>
              <Select
                mode="multiple"
                value={filters.region}
                onChange={(value) => handleFilterChange('region', value)}
                placeholder="请选择地域/机房"
                style={{ width: '100%' }}
                allowClear
                maxTagCount="responsive"
              >
                {renderRegionOptions()}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="filter-item">
              <label className="filter-label">产品类型：</label>
              <Select
                mode="multiple"
                value={filters.productType}
                onChange={(value) => handleFilterChange('productType', value)}
                placeholder="请选择产品类型"
                style={{ width: '100%' }}
                allowClear
                maxTagCount="responsive"
              >
                {productTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* 第二行：需求、操作按钮 */}
          <Col xs={24} sm={12} md={6}>
            <div className="filter-item">
              <label className="filter-label">需求：</label>
              <Select
                mode="multiple"
                value={filters.demand}
                onChange={(value) => handleFilterChange('demand', value)}
                placeholder="请选择需求类型"
                style={{ width: '100%' }}
                allowClear
                maxTagCount="responsive"
              >
                {demandOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={18}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              height: '32px',
              alignItems: 'center'
            }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={handleSearch}
              >
                查询
              </Button>
            </div>
          </Col>
        </Row>

        {/* 已选择的筛选条件展示 */}
        {(filters.clusterCascader.length > 0 ||
          filters.region.length > 0 || filters.productType.length > 0 || filters.demand.length > 0) && (
          <div className="selected-filters">
            <div style={{ marginBottom: 8, fontSize: '14px', fontWeight: 500, color: '#666' }}>已选择的筛选条件：</div>
            <Space wrap>
              {filters.clusterCascader.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', color: '#666', marginRight: 4 }}>集群组/专区：</span>
                  {filters.clusterCascader.map((cascaderPath, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => {
                        const newCascaderValues = filters.clusterCascader.filter((_, i) => i !== index);
                        handleClusterCascaderChange(newCascaderValues);
                      }}
                    >
                      {cascaderPath.join(' / ')}
                    </Tag>
                  ))}
                </div>
              )}
              {filters.region.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', color: '#666', marginRight: 4 }}>地域/机房：</span>
                  {filters.region.map(region => (
                    <Tag key={region} closable onClose={() => handleFilterChange('region', filters.region.filter(r => r !== region))}>
                      {region}
                    </Tag>
                  ))}
                </div>
              )}
              {filters.productType.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', color: '#666', marginRight: 4 }}>产品类型：</span>
                  {filters.productType.map(type => (
                    <Tag key={type} closable onClose={() => handleFilterChange('productType', filters.productType.filter(t => t !== type))}>
                      {productTypeOptions.find(opt => opt.value === type)?.label || type}
                    </Tag>
                  ))}
                </div>
              )}
              {filters.demand.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', color: '#666', marginRight: 4 }}>需求：</span>
                  {filters.demand.map(demand => (
                    <Tag key={demand} closable onClose={() => handleFilterChange('demand', filters.demand.filter(d => d !== demand))}>
                      {demandOptions.find(opt => opt.value === demand)?.label || demand}
                    </Tag>
                  ))}
                </div>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* 汇总说明 */}
      <SupplyDemandSummary
        data={trendData}
        filters={filters}
        onNavigateToResourceProcurement={onNavigateToResourceProcurement}
      />

      {/* 供需匹配趋势图表 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>库存 VS 需求匹配</span>
            <Tag color="green">实线：历史数据</Tag>
            <Tag color="purple">虚线：预测数据</Tag>
          </div>
        }
        className="trend-card"
      >
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: '总需求（全部需求）',
              children: (
                <div style={{ height: '500px' }}>
                  {trendData ? (
                    <SupplyDemandTrendChart
                      data={trendData}
                      activeTab="all"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'pending',
              label: '待评估需求',
              children: (
                <div style={{ height: '500px' }}>
                  {trendData ? (
                    <SupplyDemandTrendChart
                      data={trendData}
                      activeTab="pending"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'confirmed',
              label: '确认待交付需求',
              children: (
                <div style={{ height: '500px' }}>
                  {trendData ? (
                    <SupplyDemandTrendChart
                      data={trendData}
                      activeTab="confirmed"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* 资源缺口趋势图表 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>资源缺口趋势</span>
            <Tag color="red">红色面积：资源缺口</Tag>
            <Tag color="green">实线：历史数据</Tag>
            <Tag color="purple">虚线：预测数据</Tag>
          </div>
        }
        className="gap-trend-card"
        style={{ marginTop: 16 }}
      >
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: '总需求缺口',
              children: (
                <div style={{ height: '400px' }}>
                  {trendData ? (
                    <ResourceGapTrendChart
                      data={trendData}
                      activeTab="all"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'pending',
              label: '待评估需求缺口',
              children: (
                <div style={{ height: '400px' }}>
                  {trendData ? (
                    <ResourceGapTrendChart
                      data={trendData}
                      activeTab="pending"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'confirmed',
              label: '确认待交付需求缺口',
              children: (
                <div style={{ height: '400px' }}>
                  {trendData ? (
                    <ResourceGapTrendChart
                      data={trendData}
                      activeTab="confirmed"
                      filters={filters}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                      正在加载数据...
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default SupplyDemandMatchingPage;
