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
  Statistic,
  Steps
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import './ResourceProcurementPage.css';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const AddMeasurePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const planData = location.state?.planData;

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProcurementIds, setSelectedProcurementIds] = useState([]);
  const [procurementTableVisible, setProcurementTableVisible] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 筹措类型选项
  const measureTypes = [
    { value: '私有云提拉', label: '私有云提拉', color: 'blue' },
    { value: '私有云到货', label: '私有云到货', color: 'green' },
    { value: '私有云借调', label: '私有云借调', color: 'purple' },
    { value: '公有云采购', label: '公有云采购', color: 'orange' },
    { value: 'PaaS借调', label: 'PaaS借调', color: 'geekblue' },
    { value: '资源盘活', label: '资源盘活', color: 'cyan' }
  ];

  // 举措状态选项
  const measureStatusOptions = [
    { value: '处理中', label: '处理中', color: 'processing' },
    { value: '完成', label: '完成', color: 'success' },
    { value: '取消', label: '取消', color: 'error' }
  ];

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

  // 处理筹措类型变化
  const handleMeasureTypeChange = (value) => {
    if (value === '私有云提拉') {
      setProcurementTableVisible(true);
      setCurrentStep(1);
    } else {
      setProcurementTableVisible(false);
      setSelectedProcurementIds([]);
      setCalculatedAmount(0);
      setCurrentStep(0);
      form.setFieldsValue({
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

    const roundedAmount = Math.round(totalAmount);
    setCalculatedAmount(roundedAmount);

    // 更新表单中的预计资源筹备量级
    form.setFieldsValue({
      expectedAmount: roundedAmount
    });

    if (selectedRowKeys.length > 0) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  };

  // 统一修改采购到货时间
  const handleBatchUpdateArrivalTime = () => {
    const expectedTime = form.getFieldValue('expectedTime');
    if (!expectedTime) {
      message.warning('请先选择预计资源到位时间！');
      return;
    }

    if (selectedProcurementIds.length === 0) {
      message.warning('请先选择采购单！');
      return;
    }

    const newArrivalTime = expectedTime.format('YYYY-MM-DD HH:mm');
    message.success(`已将 ${selectedProcurementIds.length} 个采购单的到货时间更新为：${newArrivalTime}`);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success('筹措举措添加成功！');
      navigate(-1); // 返回上一页
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="resource-procurement-page" style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>资源筹措管理</Breadcrumb.Item>
        <Breadcrumb.Item>筹措计划列表</Breadcrumb.Item>
        <Breadcrumb.Item>添加筹措举措</Breadcrumb.Item>
      </Breadcrumb>

      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              type="text"
            >
              返回
            </Button>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudServerOutlined style={{ color: '#1890ff' }} />
                添加筹措举措
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                {planData ? `为计划 "${planData.id}" 添加新的筹措举措` : '创建新的筹措举措'}
              </p>
            </div>
          </div>
          <Space>
            <Button onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              保存举措
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={24}>
        {/* 左侧表单区域 */}
        <Col xs={24} lg={procurementTableVisible ? 14 : 24}>
          <Card title="基本信息">
            {/* 步骤指示器 */}
            {procurementTableVisible && (
              <div style={{ marginBottom: 24 }}>
                <Steps current={currentStep} size="small">
                  <Step title="选择类型" icon={<CalculatorOutlined />} />
                  <Step title="关联采购单" icon={<CloudServerOutlined />} />
                  <Step title="完善信息" icon={<CheckCircleOutlined />} />
                </Steps>
              </div>
            )}

            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="筹措类型"
                    rules={[{ required: true, message: '请选择筹措类型' }]}
                  >
                    <Select
                      placeholder="请选择筹措类型"
                      onChange={handleMeasureTypeChange}
                    >
                      {measureTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                          <Tag color={type.color} style={{ marginRight: 8 }}>
                            {type.label}
                          </Tag>
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
                    initialValue="处理中"
                  >
                    <Select placeholder="请选择状态">
                      {measureStatusOptions.map(status => (
                        <Option key={status.value} value={status.value}>
                          <Tag color={status.color}>
                            {status.label}
                          </Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="name"
                label="筹备举措名称"
                rules={[
                  { required: true, message: '请输入举措名称' },
                  { max: 20, message: '名称不能超过20个字符' }
                ]}
              >
                <Input
                  placeholder="请输入举措名称（不超过20字符）"
                  maxLength={20}
                  showCount
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="expectedTime"
                    label="预计资源到位时间"
                    rules={[{ required: true, message: '请选择预计到位时间' }]}
                  >
                    <DatePicker
                      showTime={{ format: 'HH:mm' }}
                      format="YYYY-MM-DD HH:mm"
                      style={{ width: '100%' }}
                      placeholder="选择预计到位时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="expectedAmount"
                    label="预计资源筹备量级（核）"
                    rules={[{ required: true, message: '请输入预计筹备量级' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      placeholder="请输入预计筹备量级"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      disabled={procurementTableVisible && selectedProcurementIds.length > 0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="actualTime"
                    label="实际资源到位时间"
                  >
                    <DatePicker
                      showTime={{ format: 'HH:mm' }}
                      format="YYYY-MM-DD HH:mm"
                      style={{ width: '100%' }}
                      placeholder="选择实际到位时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="actualAmount"
                    label="实际资源筹备量级（核）"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="请输入实际筹备量级"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

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
            </Form>
          </Card>
        </Col>

        {/* 右侧采购单选择区域 */}
        {procurementTableVisible && (
          <Col xs={24} lg={10}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudServerOutlined style={{ color: '#1890ff' }} />
                  私有云采购单关联
                </div>
              }
              extra={
                <Space>
                  <Button
                    size="small"
                    onClick={handleBatchUpdateArrivalTime}
                    disabled={selectedProcurementIds.length === 0}
                    icon={<SyncOutlined />}
                  >
                    统一修改到货时间
                  </Button>
                </Space>
              }
            >
              {/* 选择状态统计 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="已选择采购单"
                    value={selectedProcurementIds.length}
                    suffix="个"
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="预计筹备量级"
                    value={calculatedAmount}
                    suffix="核"
                    valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                  />
                </Col>
              </Row>

              {/* 计算公式说明 */}
              {selectedProcurementIds.length > 0 && (
                <div style={{
                  marginBottom: 16,
                  padding: '8px 12px',
                  backgroundColor: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#1890ff', fontWeight: 'bold', marginBottom: '4px' }}>
                    📊 自动计算结果：
                  </div>
                  <div style={{ color: '#666' }}>
                    计算公式：机器数量 × CPU核数 × 2.5 × 0.77 = 预计筹备资源量级
                  </div>
                </div>
              )}

              {/* 采购单选择表格 */}
              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#fafafa'
              }}>
                <Table
                  columns={procurementSelectionColumns}
                  dataSource={procurementData}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 400 }}
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
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default AddMeasurePage;
