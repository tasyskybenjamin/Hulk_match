import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Tag,
  Space,
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
  message,
  Breadcrumb,
  Statistic
} from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  CloudServerOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './ResourceProcurementPage.css';

const { Option } = Select;
const { TextArea } = Input;

const EditMeasurePage = ({ measureId, planId, onNavigateBack }) => {
  const [measureForm] = Form.useForm();

  // 私有云提拉相关状态
  const [selectedProcurementIds, setSelectedProcurementIds] = useState([]);
  const [procurementTableVisible, setProcurementTableVisible] = useState(false);

  // 时间点组合管理状态
  const [timePoints, setTimePoints] = useState([
    {
      id: 1,
      expectedTime: null,
      expectedDatacenter: null,
      expectedAmount: null,
      actualTime: null,
      actualDatacenter: [],
      actualAmount: null
    }
  ]);

  // 资源缺口数据（模拟从父组件传入的计划数据）
  const [resourceGapData] = useState({
    planId: planId,
    resourceGapMax: 5000,
    gapStartTime: '2024-12-25 09:00',
    gapEndTime: '2024-12-28 18:00',
    datacenterGaps: {
      'BJ-DC1': 2000,
      'BJ-DC2': 1500,
      'SH-DC2': 1500
    }
  });

  // 筹措类型选项
  const measureTypes = [
    { value: '私有云提拉', label: '私有云提拉', color: 'blue' },
    { value: '公有云采购', label: '公有云采购', color: 'orange' },
    { value: '资源盘活', label: '资源盘活', color: 'cyan' }
  ];

  // 举措状态选项
  const measureStatusOptions = [
    { value: '处理中', label: '处理中', color: 'processing' },
    { value: '完成', label: '完成', color: 'success' },
    { value: '取消', label: '取消', color: 'error' }
  ];

  // 机房选项
  const datacenterOptions = [
    { value: 'BJ-DC1', label: 'BJ-DC1', region: '北京' },
    { value: 'BJ-DC2', label: 'BJ-DC2', region: '北京' },
    { value: 'BJ-DC3', label: 'BJ-DC3', region: '北京' },
    { value: 'SH-DC1', label: 'SH-DC1', region: '上海' },
    { value: 'SH-DC2', label: 'SH-DC2', region: '上海' },
    { value: 'GZ-DC1', label: 'GZ-DC1', region: '广州' },
    { value: 'GZ-DC2', label: 'GZ-DC2', region: '广州' },
    { value: 'SZ-DC1', label: 'SZ-DC1', region: '深圳' },
    { value: 'HL-DC1', label: 'HL-DC1', region: '怀来' },
    { value: 'HL-DC2', label: 'HL-DC2', region: '怀来' },
    { value: 'OTHER', label: '其他', region: '其他' }
  ];

  // 添加时间点组合
  const addTimePoint = () => {
    const newId = Math.max(...timePoints.map(tp => tp.id)) + 1;
    setTimePoints([...timePoints, {
      id: newId,
      expectedTime: null,
      expectedDatacenter: null,
      expectedAmount: null,
      actualTime: null,
      actualDatacenter: [],
      actualAmount: null
    }]);
  };

  // 删除时间点组合
  const removeTimePoint = (id) => {
    if (timePoints.length > 1) {
      setTimePoints(timePoints.filter(tp => tp.id !== id));
    }
  };

  // 更新时间点数据
  const updateTimePoint = (id, field, value) => {
    setTimePoints(timePoints.map(tp =>
      tp.id === id ? { ...tp, [field]: value } : tp
    ));
  };

  // 私有云采购与提拉数据模拟数据
  const [procurementData] = useState([
    {
      id: '1',
      package: 'Standard-8C16G',
      type: '通用型',
      cpuCores: 8,
      networkConfig: '万兆网卡',
      quantity: 50,
      region: '北京',
      datacenter: 'BJ-DC1',
      cabinetZone: 'A区',
      procurementId: 'DORA-2024-001',
      arrivalTime: '2024-12-28 14:00',
      status: '已到货',
      source: 'Dora采购单'
    },
    {
      id: '2',
      package: 'Compute-16C32G',
      type: '计算型',
      cpuCores: 16,
      networkConfig: '万兆网卡',
      quantity: 30,
      region: '上海',
      datacenter: 'SH-DC1',
      cabinetZone: 'B区',
      procurementId: 'DORA-2024-002',
      arrivalTime: '2025-01-05 10:00',
      status: '在途',
      source: 'Dora采购单'
    },
    {
      id: '3',
      package: 'Memory-8C32G',
      type: '内存型',
      cpuCores: 8,
      networkConfig: '千兆网卡',
      quantity: 25,
      region: '广州',
      datacenter: 'GZ-DC1',
      cabinetZone: 'C区',
      procurementId: 'HRS-2024-001',
      arrivalTime: '2024-12-30 16:00',
      status: '已到货',
      source: 'HRS-资源筹措-私有云提拉'
    },
    {
      id: '4',
      package: 'Standard-16C32G',
      type: '通用型',
      cpuCores: 16,
      networkConfig: '万兆网卡',
      quantity: 40,
      region: '北京',
      datacenter: 'BJ-DC2',
      cabinetZone: 'A区',
      procurementId: 'DORA-2024-003',
      arrivalTime: '2025-01-10 09:00',
      status: '在途',
      source: 'Dora采购单'
    },
    {
      id: '5',
      package: 'Storage-8C16G',
      type: '存储型',
      cpuCores: 8,
      networkConfig: '万兆网卡',
      quantity: 60,
      region: '怀来',
      datacenter: 'HL-DC1',
      cabinetZone: 'D区',
      procurementId: 'HRS-2024-002',
      arrivalTime: '2025-01-15 11:00',
      status: '在途',
      source: 'HRS-资源筹措-私有云提拉'
    }
  ]);

  // 模拟获取举措数据
  const getMeasureData = (measureId) => {
    // 这里应该根据measureId从API获取数据，现在用模拟数据
    return {
      id: measureId,
      type: '私有云提拉',
      name: '黑五活动资源紧急调配',
      timePoints: [
        {
          id: 1,
          expectedTime: '2024-12-26 10:00',
          expectedDatacenter: 'BJ-DC1',
          expectedAmount: 2000,
          actualTime: '2024-12-26 11:30',
          actualDatacenter: ['BJ-DC1'],
          actualAmount: 1800
        },
        {
          id: 2,
          expectedTime: '2024-12-26 18:00',
          expectedDatacenter: 'SH-DC2',
          expectedAmount: 1000,
          actualTime: null,
          actualDatacenter: [],
          actualAmount: null
        }
      ],
      status: '处理中',
      description: '针对黑五活动期间的流量高峰，紧急调配私有云资源以确保服务稳定性',
      relatedProcurementIds: ['2', '4'] // 关联的采购单ID
    };
  };

  // 初始化表单数据
  useEffect(() => {
    if (measureId) {
      const measureData = getMeasureData(measureId);
      measureForm.setFieldsValue({
        type: measureData.type,
        name: measureData.name,
        status: measureData.status,
        description: measureData.description
      });

      // 设置时间点数据
      const formattedTimePoints = measureData.timePoints.map(tp => ({
        ...tp,
        expectedTime: tp.expectedTime ? dayjs(tp.expectedTime, 'YYYY-MM-DD HH:mm') : null,
        actualTime: tp.actualTime ? dayjs(tp.actualTime, 'YYYY-MM-DD HH:mm') : null
      }));
      setTimePoints(formattedTimePoints);

      // 如果是私有云提拉，设置相关状态
      if (measureData.type === '私有云提拉') {
        setProcurementTableVisible(true);
        setSelectedProcurementIds(measureData.relatedProcurementIds || []);
      }
    }
  }, [measureId, measureForm]);

  // 处理筹措类型变化
  const handleMeasureTypeChange = (value) => {
    if (value === '私有云提拉') {
      setProcurementTableVisible(true);
    } else {
      setProcurementTableVisible(false);
      setSelectedProcurementIds([]);
      // 清空相关字段
      measureForm.setFieldsValue({
        expectedAmount: undefined
      });
    }
  };

  // 处理采购单选择
  const handleProcurementSelection = (selectedRowKeys, selectedRows) => {
    setSelectedProcurementIds(selectedRowKeys);

    // 自动计算预计筹备资源量级
    const totalAmount = selectedRows.reduce((sum, item) => {
      // 计算公式：机器数量 * 套餐内的 CPU 核数 * 2.5 * 0.77
      return sum + (item.quantity * item.cpuCores * 2.5 * 0.77);
    }, 0);

    // 更新表单中的预计资源筹备量级
    measureForm.setFieldsValue({
      expectedAmount: Math.round(totalAmount)
    });
  };


  // 私有云采购单选择表格列配置
  const procurementSelectionColumns = [
    {
      title: '套餐',
      dataIndex: 'package',
      key: 'package',
      width: 120,
      render: (text) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text) => (
        <Tag color={
          text === '通用型' ? 'default' :
          text === '计算型' ? 'processing' :
          text === '内存型' ? 'success' :
          text === '存储型' ? 'warning' : 'purple'
        } size="small">
          {text}
        </Tag>
      )
    },
    {
      title: 'CPU核数',
      dataIndex: 'cpuCores',
      key: 'cpuCores',
      width: 80,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '12px' }}>
          {value}核
        </span>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '12px' }}>
          {value}台
        </span>
      )
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 60,
      render: (text) => (
        <Tag color="geekblue" size="small">{text}</Tag>
      )
    },
    {
      title: '机房',
      dataIndex: 'datacenter',
      key: 'datacenter',
      width: 80,
      render: (text) => (
        <Tag color="cyan" size="small">{text}</Tag>
      )
    },
    {
      title: '采购标识',
      dataIndex: 'procurementId',
      key: 'procurementId',
      width: 120,
      render: (text, record) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>
            {text}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '1px' }}>
            {record.source}
          </div>
        </div>
      )
    },
    {
      title: '到货时间',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      width: 140,
      render: (time, record) => (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            {time}
          </div>
          <div style={{ marginTop: '1px' }}>
            <Tag color={
              record.status === '已到货' ? 'success' : 'processing'
            } size="small">
              {record.status}
            </Tag>
          </div>
        </div>
      )
    }
  ];

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await measureForm.validateFields();

      // 验证时间点数据
      const validTimePoints = timePoints.filter(tp =>
        tp.expectedTime && tp.expectedAmount && tp.expectedDatacenter
      );

      if (validTimePoints.length === 0) {
        message.error('请至少填写一个完整的时间点信息（预计时间、机房、量级）');
        return;
      }

      // 格式化时间点数据
      const formattedTimePoints = timePoints.map(tp => ({
        ...tp,
        expectedTime: tp.expectedTime ? dayjs(tp.expectedTime).format('YYYY-MM-DD HH:mm') : null,
        actualTime: tp.actualTime ? dayjs(tp.actualTime).format('YYYY-MM-DD HH:mm') : null
      }));

      // 这里可以调用API保存数据
      console.log('修改的数据:', {
        ...values,
        measureId,
        planId,
        selectedProcurementIds,
        timePoints: formattedTimePoints
      });

      message.success('筹措举措修改成功！');
      if (onNavigateBack) {
        onNavigateBack();
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 返回列表页
  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="resource-procurement-page" style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Card style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            {
              href: '/',
              title: <HomeOutlined />
            },
            {
              href: '/resource-procurement',
              title: (
                <span>
                  <SettingOutlined />
                  <span style={{ marginLeft: 4 }}>资源筹措管理</span>
                </span>
              )
            },
            {
              title: (
                <span>
                  <EditOutlined />
                  <span style={{ marginLeft: 4 }}>修改筹措举措</span>
                </span>
              )
            }
          ]}
        />
      </Card>

      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EditOutlined style={{ color: '#1890ff' }} />
              修改筹措举措
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              修改筹措举措的详细信息，支持私有云提拉关联采购单
            </p>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
          >
            返回列表
          </Button>
        </div>
      </Card>

      {/* 资源缺口数据显示 */}
      <Card title="当前资源缺口情况" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff2f0' }}>
              <Statistic
                title="总资源缺口"
                value={resourceGapData.resourceGapMax}
                suffix="核"
                valueStyle={{ color: '#f5222d', fontSize: '18px' }}
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
              <Statistic
                title="待筹措资源数量"
                value={(() => {
                  // 计算已筹措的资源量级（实际完成的）
                  const completedAmount = timePoints.reduce((sum, tp) => {
                    return sum + (tp.actualAmount || 0);
                  }, 0);

                  // 计算筹措中的资源量级（预计但未完成的）
                  const inProgressAmount = timePoints.reduce((sum, tp) => {
                    return sum + (tp.expectedAmount && !tp.actualAmount ? tp.expectedAmount : 0);
                  }, 0);

                  // 待筹措 = 总缺口 - 已筹措 - 筹措中
                  return Math.max(0, resourceGapData.resourceGapMax - completedAmount - inProgressAmount);
                })()}
                suffix="核"
                valueStyle={{ color: '#faad14', fontSize: '18px' }}
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Statistic
                title="缺口时间段"
                value={`${resourceGapData.gapStartTime} 至 ${resourceGapData.gapEndTime}`}
                valueStyle={{ color: '#52c41a', fontSize: '12px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ backgroundColor: '#e6f7ff' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1890ff' }}>
                各机房资源缺口详情：
              </div>
              <Space wrap>
                {Object.entries(resourceGapData.datacenterGaps).map(([datacenter, gap]) => (
                  <Tag key={datacenter} color="blue" style={{ margin: '2px' }}>
                    {datacenter}: {gap.toLocaleString()} 核
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 表单内容 */}
      <Card title="举措信息">
        <Form form={measureForm} layout="vertical" style={{ maxWidth: 800 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="筹措类型"
                rules={[{ required: true, message: '请选择筹措类型' }]}
              >
                <Select onChange={handleMeasureTypeChange} placeholder="请选择筹措类型">
                  {measureTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {measureStatusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 私有云提拉时显示采购单选择 */}
          {procurementTableVisible && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                  📦 选择关联的私有云采购单
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                    （仅显示状态为"在途"的采购单）
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  已选择 {selectedProcurementIds.length} 个采购单
                </span>
              </div>

              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa'
              }}>
                <Table
                  columns={procurementSelectionColumns}
                  dataSource={procurementData.filter(item => item.status === '在途')}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 300 }}
                  rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys: selectedProcurementIds,
                    onChange: handleProcurementSelection,
                    getCheckboxProps: (record) => ({
                      name: record.procurementId,
                    }),
                  }}
                />
              </div>

              {selectedProcurementIds.length > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: '12px 16px',
                  backgroundColor: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ color: '#1890ff', fontWeight: 'bold', marginBottom: '6px' }}>
                    📊 自动计算结果：
                  </div>
                  <div style={{ color: '#666' }}>
                    计算公式：机器数量 × CPU核数 × 2.5 × 0.77 = 预计筹备资源量级
                  </div>
                </div>
              )}
            </div>
          )}

          <Form.Item
            name="name"
            label="筹备举措名称"
            rules={[
              { required: true, message: '请输入举措名称' },
              { max: 20, message: '名称不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入举措名称（不超过20字符）" maxLength={20} showCount />
          </Form.Item>
          {/* 时间点组合 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <h3 style={{ margin: 0, color: '#1890ff' }}>📅 时间点详情</h3>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addTimePoint}
                size="small"
              >
                添加时间点
              </Button>
            </div>

            {timePoints.map((timePoint, index) => (
              <Card
                key={timePoint.id}
                size="small"
                style={{
                  marginBottom: 16,
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>时间点 {index + 1}</span>
                    {timePoints.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeTimePoint(timePoint.id)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                }
              >
                {/* 预计信息 */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1890ff' }}>
                    📋 预计信息
                  </div>
                  <Row gutter={8}>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        预计资源到位时间 <span style={{ color: '#f5222d' }}>*</span>
                      </div>
                      <DatePicker
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        placeholder="选择预计时间"
                        value={timePoint.expectedTime ? dayjs(timePoint.expectedTime) : null}
                        onChange={(value) => updateTimePoint(timePoint.id, 'expectedTime', value)}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        预计到货机房 <span style={{ color: '#f5222d' }}>*</span>
                      </div>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="选择机房"
                        value={timePoint.expectedDatacenter}
                        onChange={(value) => updateTimePoint(timePoint.id, 'expectedDatacenter', value)}
                      >
                        {datacenterOptions.map(dc => (
                          <Option key={dc.value} value={dc.value}>
                            {dc.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        预计资源筹备量级（核）<span style={{ color: '#f5222d' }}>*</span>
                      </div>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        placeholder="输入预计量级"
                        value={timePoint.expectedAmount}
                        onChange={(value) => updateTimePoint(timePoint.id, 'expectedAmount', value)}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Col>
                  </Row>
                </div>

                {/* 实际信息 */}
                <div style={{
                  backgroundColor: '#f6ffed',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#52c41a' }}>
                    ✅ 实际信息
                  </div>
                  <Row gutter={8}>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        实际资源到位时间
                      </div>
                      <DatePicker
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        placeholder="选择实际时间"
                        value={timePoint.actualTime ? dayjs(timePoint.actualTime) : null}
                        onChange={(value) => updateTimePoint(timePoint.id, 'actualTime', value)}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        实际到货机房
                      </div>
                      <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="选择机房"
                        value={timePoint.actualDatacenter}
                        onChange={(value) => updateTimePoint(timePoint.id, 'actualDatacenter', value)}
                      >
                        {datacenterOptions.map(dc => (
                          <Option key={dc.value} value={dc.value}>
                            {dc.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                        实际资源筹备量级（核）
                      </div>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="输入实际量级"
                        value={timePoint.actualAmount}
                        onChange={(value) => updateTimePoint(timePoint.id, 'actualAmount', value)}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Col>
                  </Row>
                </div>
              </Card>
            ))}
          </div>

          <Form.Item
            name="description"
            label="描述"
            rules={[
              { required: true, message: '请输入筹措描述' },
              { max: 200, message: '描述不能超过200个字符' }
            ]}
          >
            <TextArea
              placeholder="请输入筹措描述，介绍筹措背景与目的等（不超过200字符）"
              rows={4}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmit} size="large">
                保存修改
              </Button>
              <Button onClick={handleGoBack} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditMeasurePage;
