import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Typography, Spin, Alert, Button, Menu } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MonitorOutlined,
  TeamOutlined,
  FileTextOutlined,
  ToolOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import FilterPanel from './components/FilterPanel';
import SummaryPanel from './components/SummaryPanel';
import InventoryDemandChart from './components/InventoryDemandChart';
import FulfilledChart from './components/FulfilledChart';
import ResourceGapChart from './components/ResourceGapChart';
import ResourceProcurementPage from './components/ResourceProcurementPage';
import AddMeasurePage from './components/AddMeasurePage';
import EditMeasurePage from './components/EditMeasurePage';
import DemandManagementPage from './components/DemandManagementPage';
import InventoryManagementPage from './components/InventoryManagementPage';
import SupplyDemandMatchingPage from './components/SupplyDemandMatchingPage';
import { getResourceData } from './services/dataService';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [filters, setFilters] = useState({
    dateRange: null,
    region: null,
    productType: null,
    customer: null
  });

  const [chartData, setChartData] = useState({
    inventoryDemand: null,
    fulfilled: null,
    resourceGapTrend: null,
    summary: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState('inventory-management');
  const [collapsed, setCollapsed] = useState(false);

  // 左侧导航菜单项
  const menuItems = [
    {
      key: 'hom',
      icon: <DashboardOutlined />,
      label: 'HOM',
      children: [
        {
          key: 'supply-demand-match',
          icon: <BarChartOutlined />,
          label: '供需匹配',
        },
        {
          key: 'demand-management',
          icon: <LineChartOutlined />,
          label: '需求管理',
        },
        {
          key: 'inventory-management',
          icon: <DatabaseOutlined />,
          label: '库存管理',
        },
        {
          key: 'delivery-management',
          icon: <CloudOutlined />,
          label: '交付/回收管理',
        },
        {
          key: 'resource-procurement',
          icon: <DatabaseOutlined />,
          label: '资源筹措',
        },
        {
          key: 'configuration-management',
          icon: <SettingOutlined />,
          label: '配额管理',
        },
        {
          key: 'forecast-card',
          icon: <PieChartOutlined />,
          label: '预算卡控',
        },
      ]
    },
    {
      key: 'resource-application',
      icon: <FileTextOutlined />,
      label: '资源申请',
    },
    {
      key: 'machine-data-analysis',
      icon: <MonitorOutlined />,
      label: '宿机数据分析',
      children: [
        {
          key: 'hulk-machine-access',
          icon: <TeamOutlined />,
          label: 'Hulk机器引入',
        }
      ]
    },
    {
      key: 'machine-selection',
      icon: <ToolOutlined />,
      label: '机器选型',
      children: [
        {
          key: 'private-cloud-machine',
          icon: <CloudOutlined />,
          label: '私有云机器',
        },
        {
          key: 'weekly-report',
          icon: <FileTextOutlined />,
          label: '周知报表',
        },
        {
          key: 'auto-optimization',
          icon: <SettingOutlined />,
          label: '自动优化配置',
        },
        {
          key: 'operation-record',
          icon: <DatabaseOutlined />,
          label: '操作记录',
        }
      ]
    }
  ];

  // 获取数据
  const fetchData = async (filterParams) => {
    console.log('=== 开始获取数据 ===');
    console.log('筛选参数:', filterParams);
    setLoading(true);
    setError(null);
    try {
      const data = await getResourceData(filterParams);
      console.log('=== 数据获取成功 ===');
      console.log('返回的数据结构:', {
        inventoryDemand: data.inventoryDemand ? '有数据' : '无数据',
        fulfilled: data.fulfilled ? '有数据' : '无数据',
        resourceGapTrend: data.resourceGapTrend ? '有数据' : '无数据',
        summary: data.summary ? '有数据' : '无数据'
      });
      if (data.inventoryDemand) {
        console.log('inventoryDemand labels数量:', data.inventoryDemand.labels?.length);
      }
      if (data.fulfilled) {
        console.log('fulfilled labels数量:', data.fulfilled.labels?.length);
      }
      setChartData(data);
    } catch (error) {
      console.error('=== 获取数据失败 ===', error);
      setError(error.message);
    } finally {
      setLoading(false);
      console.log('=== 数据获取流程结束 ===');
    }
  };

  // 初始化数据
  useEffect(() => {
    console.log('App组件初始化，开始获取数据');
    console.log('当前filters:', filters);
    fetchData(filters);
  }, []);

  // 筛选条件变化时重新获取数据
  const handleFilterChange = (newFilters) => {
    console.log('筛选条件变化:', newFilters);
    setFilters(newFilters);
    fetchData(newFilters);
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            HOM-Hulk运维平台
          </Title>
        </div>
      </Header>

      <Layout>
        <Sider
          width={250}
          collapsedWidth={80}
          collapsed={collapsed}
          className="app-sider"
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['hom']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => {
              setSelectedKey(key);
              // 这里可以添加路由跳转逻辑
              console.log('选择菜单:', key);
            }}
          />
        </Sider>

        <Content className="app-content">
          <div className="content-wrapper">
          {/* 根据选中的菜单项显示不同内容 */}
          {selectedKey === 'supply-demand-match' ? (
            <SupplyDemandMatchingPage
              onNavigateToResourceProcurement={() => {
                setSelectedKey('resource-procurement');
                console.log('跳转到资源筹措页面');
              }}
            />
          ) : selectedKey === 'resource-procurement' ? (
            <ResourceProcurementPage
              onNavigateToAddMeasure={(planId) => setSelectedKey(`add-measure-${planId}`)}
              onNavigateToEditMeasure={(measureId, planId) => setSelectedKey(`edit-measure-${measureId}-${planId}`)}
            />
          ) : selectedKey.startsWith('add-measure-') ? (
            <AddMeasurePage
              planId={selectedKey.replace('add-measure-', '')}
              onNavigateBack={() => setSelectedKey('resource-procurement')}
            />
          ) : selectedKey.startsWith('edit-measure-') ? (
            <EditMeasurePage
              measureId={selectedKey.split('-')[2]}
              planId={selectedKey.split('-')[3]}
              onNavigateBack={() => setSelectedKey('resource-procurement')}
            />
          ) : selectedKey === 'demand-management' ? (
            <DemandManagementPage />
          ) : selectedKey === 'inventory-management' ? (
            <InventoryManagementPage
              onNavigateToResourceProcurement={(params) => {
                setSelectedKey('resource-procurement');
                console.log('从库存管理跳转到资源筹措页面，参数:', params);
                // 可以将参数存储到sessionStorage供资源筹措页面使用
                if (params) {
                  sessionStorage.setItem('procurementParams', JSON.stringify(params));
                }
              }}
            />
          ) : selectedKey === 'delivery-management' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                📋
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                交付与回收管理
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                本页面本期无改动
              </div>
            </div>
          ) : selectedKey === 'configuration-management' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                ⚙️
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                配额管理
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                本页面本期无改动
              </div>
            </div>
          ) : selectedKey === 'forecast-card' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                💳
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                预算卡控
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                本页面本期无改动
              </div>
            </div>
          ) : selectedKey === 'resource-application' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                📝
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                资源申请
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                改动请参考 PRD
              </div>
            </div>
          ) : selectedKey === 'machine-data-analysis' || selectedKey === 'hulk-machine-access' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                📊
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                {selectedKey === 'hulk-machine-access' ? 'Hulk机器引入' : '宿机数据分析'}
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                本页面本期无改动
              </div>
            </div>
          ) : selectedKey === 'machine-selection' || selectedKey === 'private-cloud-machine' || selectedKey === 'weekly-report' || selectedKey === 'auto-optimization' || selectedKey === 'operation-record' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                color: '#d9d9d9'
              }}>
                🔧
              </div>
              <div style={{
                fontSize: '24px',
                color: '#595959',
                fontWeight: '500',
                marginBottom: '12px'
              }}>
                {selectedKey === 'private-cloud-machine' ? '私有云机器' :
                 selectedKey === 'weekly-report' ? '周知报表' :
                 selectedKey === 'auto-optimization' ? '自动优化配置' :
                 selectedKey === 'operation-record' ? '操作记录' : '机器选型'}
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8c8c8c'
              }}>
                本页面本期无改动
              </div>
            </div>
          ) : (
            <>
              {/* 筛选面板 */}
              <Card className="filter-card" size="small">
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  loading={loading}
                />
              </Card>

          {/* 错误提示 */}
          {error && (
            <Alert
              message="数据加载失败"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
              action={
                <Button onClick={() => fetchData(filters)}>重试</Button>
              }
            />
          )}

          {/* 加载状态 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>正在加载数据...</p>
            </div>
          )}


          {/* 汇总面板 */}
          {!loading && !error && chartData.summary && (
            <SummaryPanel
              summary={chartData.summary}
              filters={filters}
              demandTrendData={chartData.demandTrend}
              inventoryTrendData={chartData.inventoryTrend}
              onNavigateToResourceProcurement={() => {
                setSelectedKey('resource-procurement');
                console.log('跳转到资源筹措页面');
                // 这里可以添加实际的路由跳转逻辑
              }}
            />
          )}

          {/* 图表展示区域 */}
          {!loading && !error && (
            <Row gutter={[16, 16]} className="charts-row">
              <Col span={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>可用库存 VS 未满足需求趋势</span>
                      <span style={{
                        fontSize: '12px',
                        color: '#9333ea',
                        background: 'rgba(147, 51, 234, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'normal'
                      }}>
                        🚨 14天后数据仅作参考
                      </span>
                    </div>
                  }
                  className="chart-card"
                  extra={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      堆叠面积图显示各供给方式贡献，绿色实线为总库存水位，紫色虚线标记14天后参考区域
                    </div>
                  }
                >
                  <div style={{ height: '400px' }}>
                    {chartData.inventoryDemand ? (
                      <InventoryDemandChart data={chartData.inventoryDemand} />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <p>等待数据加载...</p>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>资源缺口趋势</span>
                      <span style={{
                        fontSize: '12px',
                        color: '#9333ea',
                        background: 'rgba(147, 51, 234, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'normal'
                      }}>
                        🚨 14天后数据仅作参考
                      </span>
                    </div>
                  }
                  className="chart-card"
                  extra={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      红色区域显示当前资源缺口，橙色虚线显示累计缺口，紫色虚线标记14天后参考区域
                    </div>
                  }
                >
                  <div style={{ height: '400px' }}>
                    {chartData.resourceGapTrend ? (
                      <ResourceGapChart data={chartData.resourceGapTrend} />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <p>等待数据加载...</p>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>已出库库存 VS 已满足需求</span>
                      <span style={{
                        fontSize: '12px',
                        color: '#9333ea',
                        background: 'rgba(147, 51, 234, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'normal'
                      }}>
                        🚨 14天后数据仅作参考
                      </span>
                    </div>
                  }
                  className="chart-card"
                  extra={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      堆叠面积图显示各供给方式出库情况，虚线为总出库水位，紫色虚线标记14天后参考区域
                    </div>
                  }
                >
                  <div style={{ height: '400px' }}>
                    {chartData.fulfilled ? (
                      <FulfilledChart data={chartData.fulfilled} />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <p>等待数据加载...</p>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
            )}
            </>
          )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
