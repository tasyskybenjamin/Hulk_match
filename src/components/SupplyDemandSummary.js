import React from 'react';
import { Card, Row, Col, Statistic, Alert, Tag, Button } from 'antd';
import { WarningOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const SupplyDemandSummary = ({ data, filters, onNavigateToResourceProcurement }) => {
  if (!data || !data.datasets) {
    return null;
  }

  // 跳转到资源筹措页面
  const handleGoToProcurement = () => {
    if (onNavigateToResourceProcurement) {
      onNavigateToResourceProcurement();
    }
  };

  // 计算汇总数据
  const calculateSummary = () => {
    const inventory = data.datasets.find(d => d.key === 'inventory');
    const totalDemand = data.datasets.find(d => d.key === 'totalDemand');
    const pendingDemand = data.datasets.find(d => d.key === 'pendingDemand');
    const confirmedDemand = data.datasets.find(d => d.key === 'confirmedDemand');

    if (!inventory || !totalDemand) return null;

    // 找到当前时间点的索引
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = data.labels.findIndex(label => label === today);

    // 计算需求相关数据
    const totalDemandSum = totalDemand.data.reduce((sum, point) => sum + point.value, 0);
    const peakDemand = Math.max(...totalDemand.data.map(point => point.value));
    const peakDemandIndex = totalDemand.data.findIndex(point => point.value === peakDemand);
    const peakDemandDate = data.labels[peakDemandIndex];

    // 状态分布（模拟数据）
    const pendingSum = pendingDemand.data.reduce((sum, point) => sum + point.value, 0);
    const confirmedSum = confirmedDemand.data.reduce((sum, point) => sum + point.value, 0);
    const deliveredSum = Math.round(totalDemandSum * 0.6); // 模拟已交付
    const recycledSum = Math.round(totalDemandSum * 0.1); // 模拟已回收
    const rejectedSum = Math.round(totalDemandSum * 0.05); // 模拟驳回

    // 渠道分布（模拟数据）
    const dailyDemand = Math.round(totalDemandSum * 0.4);
    const activityDemand = Math.round(totalDemandSum * 0.3);
    const emergencyDemand = Math.round(totalDemandSum * 0.15);
    const specialDemand = Math.round(totalDemandSum * 0.1);
    const poolDemand = Math.round(totalDemandSum * 0.05);

    // 库存相关数据
    const peakInventory = inventory.data[peakDemandIndex]?.value || 0;
    const currentInventory = inventory.data[todayIndex]?.value || peakInventory;
    const inventoryStatus = peakInventory >= peakDemand ? 'sufficient' :
                           peakInventory >= peakDemand * 0.8 ? 'adequate' : 'insufficient';

    // 可使用库存分解（模拟数据）
    const quotaRemaining = Math.round(peakInventory * 0.4);
    const privateCloudPull = Math.round(peakInventory * 0.25);
    const normalArrival = Math.round(peakInventory * 0.2);
    const resourceBorrow = Math.round(peakInventory * 0.15);

    // 计算资源缺口
    const gaps = [];
    inventory.data.forEach((invPoint, index) => {
      const demandPoint = totalDemand.data[index];
      const gap = Math.max(0, demandPoint.value - invPoint.value);
      if (gap > 0) {
        gaps.push({
          gap,
          date: data.labels[index],
          isPast: todayIndex === -1 || index <= todayIndex
        });
      }
    });

    const currentGap = todayIndex !== -1 && gaps.find(g => g.date === data.labels[todayIndex]);
    const maxGap = gaps.length > 0 ? gaps.reduce((max, current) =>
      current.gap > max.gap ? current : max
    ) : null;

    return {
      // 需求数据
      totalDemandSum,
      peakDemand,
      peakDemandDate,
      statusDistribution: {
        pending: pendingSum,
        confirmed: confirmedSum,
        delivered: deliveredSum,
        recycled: recycledSum,
        rejected: rejectedSum
      },
      channelDistribution: {
        daily: dailyDemand,
        activity: activityDemand,
        emergency: emergencyDemand,
        special: specialDemand,
        pool: poolDemand
      },
      // 库存数据
      peakInventory,
      currentInventory,
      inventoryStatus,
      availableInventory: {
        quota: quotaRemaining,
        privateCloudPull: privateCloudPull,
        normalArrival: normalArrival,
        resourceBorrow: resourceBorrow,
        total: quotaRemaining + privateCloudPull + normalArrival + resourceBorrow
      },
      // 缺口数据
      currentGap: currentGap?.gap || 0,
      currentGapDate: currentGap?.date,
      maxGap: maxGap?.gap || 0,
      maxGapDate: maxGap?.date,
      hasGap: gaps.length > 0
    };
  };

  const summary = calculateSummary();
  if (!summary) return null;

  const formatDate = (dateStr) => {
    return dayjs(dateStr).format('YYYY年MM月DD日');
  };

  const formatPeakTime = (dateStr) => {
    // 为峰值时刻生成随机的小时和分钟
    const date = dayjs(dateStr);
    const randomHour = Math.floor(Math.random() * 24);
    const randomMinute = Math.floor(Math.random() * 60);
    return date.hour(randomHour).minute(randomMinute).format('YYYY年MM月DD日HH点mm分');
  };

  const getInventoryStatusText = (status) => {
    switch (status) {
      case 'sufficient': return '大于需求峰值';
      case 'adequate': return '接近需求峰值';
      case 'insufficient': return '小于需求峰值';
      default: return '未知';
    }
  };

  const getInventoryStatusColor = (status) => {
    switch (status) {
      case 'sufficient': return 'success';
      case 'adequate': return 'warning';
      case 'insufficient': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊 资源汇总说明</span>
        </div>
      }
      className="supply-demand-summary"
      style={{ marginBottom: 16 }}
    >
      {/* 筛选条件的时间范围 */}
      <div style={{ marginBottom: 20, color: '#666', fontSize: '14px' }}>
        时间范围：{filters?.dateRange ? `${filters.dateRange[0].format('YYYY-MM-DD')} 至 ${filters.dateRange[1].format('YYYY-MM-DD')}` : '2025-07-20 至 2025-09-20'}
      </div>

      {/* 上半部分：左右两栏布局 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 左侧：需求信息 */}
        <Col span={12}>
          <div style={{
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '8px',
            padding: '20px',
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              color: '#fa8c16',
              fontSize: '18px'
            }}>
              📊
            </div>

            {/* 总需求数值突出显示 */}
            <div style={{ marginLeft: '32px', marginBottom: '20px' }}>
              <div style={{
                fontSize: '14px',
                color: '#8c8c8c',
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                总需求
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#d46b08',
                lineHeight: '1.2',
                marginBottom: '8px'
              }}>
                {summary.totalDemandSum.toLocaleString()}
                <span style={{ fontSize: '18px', marginLeft: '4px' }}>核</span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#8c8c8c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>峰值时刻：{formatPeakTime(summary.peakDemandDate)}</span>
                <span style={{
                  backgroundColor: '#fff2e8',
                  color: '#d46b08',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {summary.peakDemand.toLocaleString()} 核
                </span>
              </div>
            </div>

            {/* 需求洞察区域 */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 状态分布 */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: '#fa8c16' }}>●</span>
                  状态分布
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ffe7ba',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ffefd6';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>待评估</div>
                    <div style={{ color: '#fa8c16', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.statusDistribution.pending.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.statusDistribution.pending / summary.totalDemandSum) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ffe7ba',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ffefd6';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>确认待交付</div>
                    <div style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.statusDistribution.confirmed.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.statusDistribution.confirmed / summary.totalDemandSum) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ffe7ba',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ffefd6';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>已交付</div>
                    <div style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.statusDistribution.delivered.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.statusDistribution.delivered / (summary.totalDemandSum + summary.statusDistribution.delivered + summary.statusDistribution.recycled)) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #ffe7ba',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ffefd6';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>已回收</div>
                    <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.statusDistribution.recycled.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.statusDistribution.recycled / (summary.totalDemandSum + summary.statusDistribution.delivered + summary.statusDistribution.recycled)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 渠道分布 */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: '#1890ff' }}>●</span>
                  渠道分布
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  fontSize: '12px'
                }}>
                  {[
                    { key: 'daily', label: '日常', value: summary.channelDistribution.daily, color: '#1890ff' },
                    { key: 'activity', label: '活动', value: summary.channelDistribution.activity, color: '#fa541c' },
                    { key: 'emergency', label: '应急', value: summary.channelDistribution.emergency, color: '#f5222d' },
                    { key: 'special', label: '专项', value: summary.channelDistribution.special, color: '#722ed1' },
                    { key: 'pool', label: '资源池', value: summary.channelDistribution.pool, color: '#13c2c2' }
                  ].map(item => (
                    <div key={item.key} style={{
                      padding: '6px 10px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '1px solid #ffe7ba',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: 'fit-content'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ffefd6';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.transform = 'scale(1)';
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }}></span>
                      <span style={{ color: '#595959', fontSize: '11px' }}>{item.label}</span>
                      <span style={{ color: item.color, fontWeight: 'bold', fontSize: '11px' }}>
                        {item.value.toLocaleString()}
                      </span>
                      <span style={{ color: '#8c8c8c', fontSize: '10px' }}>
                        ({((item.value / summary.totalDemandSum) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* 右侧：库存信息 */}
        <Col span={12}>
          <div style={{
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '8px',
            padding: '20px',
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              color: '#52c41a',
              fontSize: '18px'
            }}>
              📦
            </div>

            {/* 总库存数值突出显示 */}
            <div style={{ marginLeft: '32px', marginBottom: '20px' }}>
              <div style={{
                fontSize: '14px',
                color: '#8c8c8c',
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                总库存
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#389e0d',
                lineHeight: '1.2',
                marginBottom: '8px'
              }}>
                {(summary.availableInventory.total + summary.statusDistribution.delivered + summary.statusDistribution.recycled).toLocaleString()}
                <span style={{ fontSize: '18px', marginLeft: '4px' }}>核</span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#8c8c8c',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>需求峰值时刻为：{formatPeakTime(summary.peakDemandDate)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>预计库存：{summary.peakInventory.toLocaleString()} 核</span>
                  <span style={{
                    backgroundColor: summary.inventoryStatus === 'insufficient' ? '#fff2e8' : '#f6ffed',
                    color: summary.inventoryStatus === 'insufficient' ? '#fa8c16' : '#52c41a',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {getInventoryStatusText(summary.inventoryStatus)}
                  </span>
                </div>
              </div>
            </div>

            {/* 库存洞察区域 */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* 状态分布 */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: '#52c41a' }}>●</span>
                  状态分布
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #d9f7be',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f6ffed';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>可用库存</div>
                    <div style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.availableInventory.total.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.availableInventory.total / (summary.availableInventory.total + summary.statusDistribution.delivered + summary.statusDistribution.recycled)) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #d9f7be',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f6ffed';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>已出库</div>
                    <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '14px' }}>
                      {summary.statusDistribution.delivered.toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
                      {((summary.statusDistribution.delivered / (summary.availableInventory.total + summary.statusDistribution.delivered + summary.statusDistribution.recycled)) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #d9f7be',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f6ffed';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>安全预留</div>
                    <div style={{ color: '#fa8c16', fontWeight: 'bold', fontSize: '14px' }}>
                      {Math.round(summary.availableInventory.total * 0.15).toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>15.0%</div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #d9f7be',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f6ffed';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>紧急资源</div>
                    <div style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '14px' }}>
                      {Math.round(summary.availableInventory.total * 0.1).toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>10.0%</div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #d9f7be',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gridColumn: 'span 1'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f6ffed';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ color: '#8c8c8c', fontSize: '11px' }}>运维资源</div>
                    <div style={{ color: '#722ed1', fontWeight: 'bold', fontSize: '14px' }}>
                      {Math.round(summary.availableInventory.total * 0.08).toLocaleString()}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '10px' }}>8.0%</div>
                  </div>
                </div>
              </div>

              {/* 用途分布 */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#595959',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: '#1890ff' }}>●</span>
                  用途分布
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  fontSize: '12px'
                }}>
                  {[
                    {
                      key: 'business',
                      label: '业务',
                      value: Math.round((summary.availableInventory.total + summary.statusDistribution.delivered) * 0.45),
                      color: '#1890ff'
                    },
                    {
                      key: 'platform',
                      label: '平台',
                      value: Math.round((summary.availableInventory.total + summary.statusDistribution.delivered) * 0.25),
                      color: '#52c41a'
                    },
                    {
                      key: 'self-use',
                      label: '自用',
                      value: Math.round((summary.availableInventory.total + summary.statusDistribution.delivered) * 0.15),
                      color: '#fa8c16'
                    },
                    {
                      key: 'ops',
                      label: '运维',
                      value: Math.round((summary.availableInventory.total + summary.statusDistribution.delivered) * 0.1),
                      color: '#722ed1'
                    },
                    {
                      key: 'emergency-pool',
                      label: '紧急资源池',
                      value: Math.round((summary.availableInventory.total + summary.statusDistribution.delivered) * 0.05),
                      color: '#f5222d'
                    }
                  ].map(item => (
                    <div key={item.key} style={{
                      padding: '6px 10px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '1px solid #d9f7be',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: 'fit-content'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f6ffed';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.transform = 'scale(1)';
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }}></span>
                      <span style={{ color: '#595959', fontSize: '11px' }}>{item.label}</span>
                      <span style={{ color: item.color, fontWeight: 'bold', fontSize: '11px' }}>
                        {item.value.toLocaleString()}核
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 下半部分：资源缺口预警 */}
      {summary.hasGap ? (
        <div style={{
          backgroundColor: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '6px',
          padding: '16px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            color: '#fa8c16',
            fontSize: '16px'
          }}>
            ⚠️
          </div>
          <div style={{ marginLeft: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#d46b08' }}>
                资源缺口预警
              </span>
              <Button
                type="primary"
                size="small"
                icon={<SettingOutlined />}
                onClick={handleGoToProcurement}
                style={{
                  backgroundColor: '#f5222d',
                  borderColor: '#f5222d',
                  boxShadow: '0 2px 4px rgba(245, 34, 45, 0.3)'
                }}
              >
                资源筹措
              </Button>
            </div>
            <div style={{ fontSize: '14px', color: '#d46b08', lineHeight: '1.6' }}>
              时间范围内存在资源缺口，最大资源缺口：<span style={{ fontWeight: 'bold', color: '#f5222d' }}>{summary.maxGap.toLocaleString()} 核</span>，
              时间：{formatDate(summary.maxGapDate)}
            </div>
            <div style={{ fontSize: '14px', color: '#f5222d', marginTop: '4px' }}>
              请 Hulk 资源运营及时进行资源筹备
            </div>
          </div>
        </div>
      ) : (
        <Alert
          message="资源供给充足"
          description="当前时间范围内无资源缺口，资源供给充足"
          type="success"
          showIcon
        />
      )}
    </Card>
  );
};

export default SupplyDemandSummary;
