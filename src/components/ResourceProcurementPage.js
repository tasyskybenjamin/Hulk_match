import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  DatePicker,
  message,
  Divider,
  Popconfirm,
  Tooltip,
  Tabs,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  DownOutlined,
  RightOutlined,
  CloudServerOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './ResourceProcurementPage.css';

const { Option } = Select;
const { TextArea } = Input;

const ResourceProcurementPage = ({ onNavigateToAddMeasure, onNavigateToEditMeasure }) => {
  const [createPlanModalVisible, setCreatePlanModalVisible] = useState(false);
  const [editPlanModalVisible, setEditPlanModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // 新增：Tab 相关状态
  const [activeTab, setActiveTab] = useState('plans');
  const [procurementFilters, setProcurementFilters] = useState({
    package: [],
    type: [],
    cpuCores: [],
    region: [],
    datacenter: [],
    cabinetZone: [],
    arrivalTimeRange: null
  });
  const [procurementLoading, setProcurementLoading] = useState(false);

  // 新增：私有云提拉相关状态
  const [selectedProcurementIds, setSelectedProcurementIds] = useState([]);
  const [procurementTableVisible, setProcurementTableVisible] = useState(false);

  // 新增：筹措计划筛选状态
  const [planFilters, setPlanFilters] = useState({
    status: [],
    datacenter: [],
    initiator: '',
    createTimeRange: null,
    resourceGapRange: [null, null]
  });
  const [planLoading, setPlanLoading] = useState(false);

  const [planForm] = Form.useForm();
  const [editPlanForm] = Form.useForm();
  const [measureForm] = Form.useForm();
  const [editMeasureForm] = Form.useForm();
  const [procurementFilterForm] = Form.useForm();

  // 添加状态来跟踪当前计算结果
  const [currentCalculation, setCurrentCalculation] = useState(null);

  // 模拟筹措计划数据
  const [procurementPlans, setProcurementPlans] = useState([
    {
      id: '1',
      resourceGapMax: 5000,
      gapStartTime: '2024-12-25 09:00',
      gapEndTime: '2024-12-28 18:00',
      datacenter: ['BJ-DC1', 'BJ-DC2'],
      status: '筹备中',
      initiator: 'zhangsan',
      createTime: '2024-12-20 14:30',
      measures: [
        {
          id: '1-1',
          type: '私有云提拉',
          name: '黑五活动资源紧急调配',
          timePoints: [
            {
              expectedTime: '2024-12-26 10:00',
              expectedAmount: 2000,
              actualTime: '',
              actualAmount: 0
            },
            {
              expectedTime: '2024-12-26 18:00',
              expectedAmount: 1000,
              actualTime: '',
              actualAmount: 0
            }
          ],
          status: '处理中',
          description: '针对黑五活动期间的流量高峰，紧急调配私有云资源以确保服务稳定性'
        },
        {
          id: '1-2',
          type: '公有云采购',
          name: '临时扩容补充',
          timePoints: [
            {
              expectedTime: '2024-12-27 15:00',
              expectedAmount: 2000,
              actualTime: '',
              actualAmount: 0
            }
          ],
          status: '处理中',
          description: '通过公有云采购补充临时扩容需求，应对活动期间的资源不足'
        }
      ]
    },
    {
      id: '2',
      resourceGapMax: 8000,
      gapStartTime: '2025-01-15 08:00',
      gapEndTime: '2025-01-20 20:00',
      datacenter: ['SH-DC2'],
      status: '待筹备',
      initiator: 'lisi',
      createTime: '2024-12-18 16:45',
      measures: [
        {
          id: '2-1',
          type: '私有云提拉',
          name: '春节大促资源储备',
          timePoints: [
            {
              expectedTime: '2025-01-10 12:00',
              expectedAmount: 5000,
              actualTime: '',
              actualAmount: 0
            }
          ],
          status: '处理中',
          description: '为春节大促活动提前储备私有云资源，确保活动期间服务稳定'
        },
        {
          id: '2-2',
          type: 'PaaS借调',
          name: '内部资源调配',
          timePoints: [
            {
              expectedTime: '2025-01-12 14:00',
              expectedAmount: 3000,
              actualTime: '',
              actualAmount: 0
            }
          ],
          status: '处理中',
          description: '通过PaaS平台内部资源调配，优化资源利用率'
        }
      ]
    },
    {
      id: '3',
      resourceGapMax: 3500,
      gapStartTime: '2024-12-10 10:00',
      gapEndTime: '2024-12-15 16:00',
      datacenter: ['GZ-DC1'],
      status: '筹备完成',
      initiator: 'wangwu',
      createTime: '2024-12-05 11:20',
      measures: [
        {
          id: '3-1',
          type: '资源盘活',
          name: '闲置资源重新分配',
          timePoints: [
            {
              expectedTime: '2024-12-08 09:00',
              expectedAmount: 2000,
              actualTime: '2024-12-08 10:30',
              actualAmount: 2200
            }
          ],
          status: '完成',
          description: '通过盘活闲置资源，重新分配给有需求的业务线，提高资源利用率'
        },
        {
          id: '3-2',
          type: '私有云提拉',
          name: '紧急资源调配',
          timePoints: [
            {
              expectedTime: '2024-12-09 14:00',
              expectedAmount: 1500,
              actualTime: '2024-12-09 13:45',
              actualAmount: 1300
            }
          ],
          status: '完成',
          description: '紧急调配私有云资源，应对突发的业务需求增长'
        }
      ]
    }
  ]);

  // 筹措类型选项
  const measureTypes = [
    { value: '私有云提拉', label: '私有云提拉', color: 'blue' },
    { value: '私有云借调', label: '私有云借调', color: 'purple' },
    { value: '公有云采购', label: '公有云采购', color: 'orange' },
    { value: 'PaaS借调', label: 'PaaS借调', color: 'geekblue' },
    { value: '资源盘活', label: '资源盘活', color: 'cyan' }
  ];

  // 计划状态选项
  const planStatusOptions = [
    { value: '待筹备', label: '待筹备', color: 'default' },
    { value: '筹备中', label: '筹备中', color: 'processing' },
    { value: '筹备完成', label: '筹备完成', color: 'success' },
    { value: '已取消', label: '已取消', color: 'error' }
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

  // 私有云采购与提拉数据的筛选选项
  const packageOptions = [
    { value: 'Standard-4C8G', label: 'Standard-4C8G' },
    { value: 'Standard-8C16G', label: 'Standard-8C16G' },
    { value: 'Standard-16C32G', label: 'Standard-16C32G' },
    { value: 'Compute-8C16G', label: 'Compute-8C16G' },
    { value: 'Compute-16C32G', label: 'Compute-16C32G' },
    { value: 'Memory-8C32G', label: 'Memory-8C32G' },
    { value: 'Memory-16C64G', label: 'Memory-16C64G' },
    { value: 'Storage-8C16G', label: 'Storage-8C16G' }
  ];

  const typeOptions = [
    { value: '通用型', label: '通用型' },
    { value: '计算型', label: '计算型' },
    { value: '内存型', label: '内存型' },
    { value: '存储型', label: '存储型' },
    { value: 'GPU型', label: 'GPU型' }
  ];

  const cpuCoresOptions = [
    { value: '4', label: '4核' },
    { value: '8', label: '8核' },
    { value: '16', label: '16核' },
    { value: '32', label: '32核' },
    { value: '64', label: '64核' }
  ];

  const regionOptions = [
    { value: '北京', label: '北京' },
    { value: '上海', label: '上海' },
    { value: '广州', label: '广州' },
    { value: '深圳', label: '深圳' },
    { value: '怀来', label: '怀来' },
    { value: '其他', label: '其他' }
  ];

  const cabinetZoneOptions = [
    { value: 'A区', label: 'A区' },
    { value: 'B区', label: 'B区' },
    { value: 'C区', label: 'C区' },
    { value: 'D区', label: 'D区' },
    { value: 'E区', label: 'E区' }
  ];

  // 私有云采购与提拉数据模拟数据
  const [procurementData, setProcurementData] = useState([
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

  // 主表列配置
  const mainColumns = [
    {
      title: '资源缺口最大值',
      dataIndex: 'resourceGapMax',
      key: 'resourceGapMax',
      width: 140,
      render: (value) => <span style={{ fontWeight: 'bold', color: '#f5222d' }}>{value.toLocaleString()} 核</span>
    },
    {
      title: '缺口时间段',
      key: 'gapTimeRange',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>开始：{record.gapStartTime}</div>
          <div>结束：{record.gapEndTime}</div>
        </div>
      )
    },
    {
      title: '涉及机房',
      dataIndex: 'datacenter',
      key: 'datacenter',
      width: 120,
      render: (value) => (
        <div>
          {Array.isArray(value) ? (
            value.map((dc, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px' }}>
                {dc}
              </Tag>
            ))
          ) : (
            <Tag color="blue">{value}</Tag>
          )}
        </div>
      )
    },
    {
      title: '计划状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = planStatusOptions.find(item => item.value === status);
        return <Tag color={config?.color}>{status}</Tag>;
      }
    },
    {
      title: '发起人',
      dataIndex: 'initiator',
      key: 'initiator',
      width: 80
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: (time) => <span style={{ fontSize: '12px' }}>{time}</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPlanStatus(record)}
          >
            修改状态
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddMeasure(record)}
          >
            添加举措
          </Button>
        </Space>
      )
    }
  ];

  // 子表列配置
  const subColumns = [
    {
      title: '筹措类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const config = measureTypes.find(item => item.value === type);
        return <Tag color={config?.color}>{type}</Tag>;
      }
    },
    {
      title: '举措名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: '时间点详情',
      dataIndex: 'timePoints',
      key: 'timePoints',
      width: 300,
      render: (timePoints) => (
        <div>
          {timePoints.map((point, index) => (
            <div key={index} style={{
              fontSize: '12px',
              marginBottom: index < timePoints.length - 1 ? '8px' : '0',
              padding: '4px 8px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              <div style={{ marginBottom: '2px' }}>
                <span style={{ color: '#666', fontWeight: 'bold' }}>预计：</span>
                <span style={{ marginLeft: '4px' }}>{point.expectedTime}</span>
                <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#1890ff' }}>
                  {point.expectedAmount.toLocaleString()} 核
                </span>
              </div>
              <div>
                <span style={{ color: '#666', fontWeight: 'bold' }}>实际：</span>
                <span style={{
                  marginLeft: '4px',
                  color: point.actualTime ? '#52c41a' : '#999'
                }}>
                  {point.actualTime || '未完成'}
                </span>
                <span style={{
                  marginLeft: '8px',
                  fontWeight: 'bold',
                  color: point.actualAmount > 0 ? '#52c41a' : '#999'
                }}>
                  {point.actualAmount > 0 ? `${point.actualAmount.toLocaleString()} 核` : '未完成'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (description) => (
        <Tooltip placement="topLeft" title={description}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {description}
          </span>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const config = measureStatusOptions.find(item => item.value === status);
        return <Tag color={config?.color}>{status}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleEditMeasure(record)}
          >
            修改信息
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条筹措举措吗？"
            onConfirm={() => handleDeleteMeasure(record)}
            okText="确认删除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 展开行渲染
  const expandedRowRender = (record) => {
    return (
      <Table
        columns={subColumns}
        dataSource={record.measures}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ margin: '0 48px' }}
      />
    );
  };

  // 处理展开/收起
  const handleExpand = (expanded, record) => {
    const keys = expanded
      ? [...expandedRowKeys, record.id]
      : expandedRowKeys.filter(key => key !== record.id);
    setExpandedRowKeys(keys);
  };

  // 模拟需求数据API
  const getDemandData = (startTime, endTime) => {
    // 模拟根据时间范围获取需求数据
    const mockDemandData = [
      { time: '2024-12-25 09:00', datacenter: 'BJ-DC1', demand: 2000 },
      { time: '2024-12-25 12:00', datacenter: 'BJ-DC2', demand: 1500 },
      { time: '2024-12-26 10:00', datacenter: 'BJ-DC1', demand: 3000 },
      { time: '2024-12-27 15:00', datacenter: 'SH-DC1', demand: 2500 },
      { time: '2025-01-15 08:00', datacenter: 'SH-DC2', demand: 4000 },
      { time: '2025-01-16 14:00', datacenter: 'GZ-DC1', demand: 1800 }
    ];

    return mockDemandData.filter(item => {
      const itemTime = dayjs(item.time);
      return itemTime.isAfter(dayjs(startTime)) && itemTime.isBefore(dayjs(endTime));
    });
  };

  // 模拟库存数据API
  const getInventoryData = (startTime, endTime) => {
    // 模拟根据时间范围获取库存数据
    const mockInventoryData = [
      { time: '2024-12-25 09:00', datacenter: 'BJ-DC1', inventory: 800 },
      { time: '2024-12-25 12:00', datacenter: 'BJ-DC2', inventory: 600 },
      { time: '2024-12-26 10:00', datacenter: 'BJ-DC1', inventory: 1200 },
      { time: '2024-12-27 15:00', datacenter: 'SH-DC1', inventory: 1000 },
      { time: '2025-01-15 08:00', datacenter: 'SH-DC2', inventory: 1500 },
      { time: '2025-01-16 14:00', datacenter: 'GZ-DC1', inventory: 900 }
    ];

    return mockInventoryData.filter(item => {
      const itemTime = dayjs(item.time);
      return itemTime.isAfter(dayjs(startTime)) && itemTime.isBefore(dayjs(endTime));
    });
  };

  // 获取现有筹措举措数据
  const getExistingMeasures = (startTime, endTime) => {
    const allMeasures = procurementPlans.flatMap(plan =>
      plan.measures.flatMap(measure =>
        measure.timePoints.map(timePoint => ({
          ...measure,
          datacenter: plan.datacenter,
          expectedTime: timePoint.expectedTime,
          expectedAmount: timePoint.expectedAmount
        }))
      )
    );

    return allMeasures.filter(measure => {
      const measureTime = dayjs(measure.expectedTime);
      return measureTime.isAfter(dayjs(startTime)) && measureTime.isBefore(dayjs(endTime));
    });
  };

  // 自动计算资源缺口和涉及机房
  const calculateResourceGap = (startTime, endTime) => {
    const demandData = getDemandData(startTime, endTime);
    const inventoryData = getInventoryData(startTime, endTime);
    const existingMeasures = getExistingMeasures(startTime, endTime);

    // 按机房分组计算
    const datacenterStats = {};

    // 统计需求量
    demandData.forEach(item => {
      if (!datacenterStats[item.datacenter]) {
        datacenterStats[item.datacenter] = { demand: 0, inventory: 0, measures: 0 };
      }
      datacenterStats[item.datacenter].demand += item.demand;
    });

    // 统计库存量
    inventoryData.forEach(item => {
      if (!datacenterStats[item.datacenter]) {
        datacenterStats[item.datacenter] = { demand: 0, inventory: 0, measures: 0 };
      }
      datacenterStats[item.datacenter].inventory += item.inventory;
    });

    // 统计现有筹措举措
    existingMeasures.forEach(measure => {
      const datacenters = Array.isArray(measure.datacenter) ? measure.datacenter : [measure.datacenter];
      datacenters.forEach(dc => {
        if (!datacenterStats[dc]) {
          datacenterStats[dc] = { demand: 0, inventory: 0, measures: 0 };
        }
        datacenterStats[dc].measures += measure.expectedAmount;
      });
    });

    // 计算各机房缺口
    const gaps = {};
    let maxGap = 0;
    const involvedDatacenters = [];

    Object.keys(datacenterStats).forEach(datacenter => {
      const stats = datacenterStats[datacenter];
      const gap = stats.demand - stats.inventory - stats.measures;

      if (gap > 0) {
        gaps[datacenter] = gap;
        maxGap += gap;
        involvedDatacenters.push(datacenter);
      }
    });

    return {
      resourceGapMax: maxGap,
      involvedDatacenters: involvedDatacenters,
      datacenterGaps: gaps
    };
  };

  // 处理时间选择变化，实时计算资源缺口
  const handleTimeChange = () => {
    const startTime = planForm.getFieldValue('gapStartTime');
    const endTime = planForm.getFieldValue('gapEndTime');

    if (startTime && endTime) {
      const startTimeStr = startTime.format('YYYY-MM-DD HH:mm');
      const endTimeStr = endTime.format('YYYY-MM-DD HH:mm');

      const calculation = calculateResourceGap(startTimeStr, endTimeStr);
      setCurrentCalculation(calculation);
    } else {
      setCurrentCalculation(null);
    }
  };

  // 创建筹措计划
  const handleCreatePlan = () => {
    setCreatePlanModalVisible(true);
    planForm.resetFields();
    setCurrentCalculation(null);
  };

  const handleCreatePlanSubmit = async () => {
    try {
      const values = await planForm.validateFields();

      const startTime = values.gapStartTime.format('YYYY-MM-DD HH:mm');
      const endTime = values.gapEndTime.format('YYYY-MM-DD HH:mm');

      // 自动计算资源缺口和涉及机房
      const calculation = calculateResourceGap(startTime, endTime);

      // 允许创建筹措计划，即使没有资源缺口
      const newPlan = {
        id: Date.now().toString(),
        resourceGapMax: Math.max(0, calculation.resourceGapMax), // 确保不为负数
        gapStartTime: startTime,
        gapEndTime: endTime,
        datacenter: calculation.involvedDatacenters.length > 0 ? calculation.involvedDatacenters : ['ALL'], // 如果没有涉及机房，设置为ALL
        status: '待完善',
        initiator: 'system',
        createTime: dayjs().format('YYYY-MM-DD HH:mm'),
        measures: [],
        datacenterGaps: calculation.datacenterGaps // 保存各机房的缺口详情
      };

      setProcurementPlans(prev => [newPlan, ...prev]);

      message.success(
        calculation.resourceGapMax > 0
          ? `筹措计划创建成功！\n资源缺口最大值：${calculation.resourceGapMax.toLocaleString()} 核\n涉及机房：${calculation.involvedDatacenters.join(', ')}`
          : `预防性筹措计划创建成功！\n该时间段内无资源缺口，已创建预防性筹措计划用于资源储备和优化配置。`
      );

      setCreatePlanModalVisible(false);
      planForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 修改计划状态
  const handleEditPlanStatus = (record) => {
    setEditingPlan(record);
    setEditPlanModalVisible(true);
    editPlanForm.setFieldsValue({
      status: record.status
    });
  };

  const handleEditPlanStatusSubmit = async () => {
    try {
      const values = await editPlanForm.validateFields();

      setProcurementPlans(prev =>
        prev.map(plan =>
          plan.id === editingPlan.id
            ? { ...plan, status: values.status }
            : plan
        )
      );

      message.success('计划状态修改成功！');
      setEditPlanModalVisible(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 添加筹措举措
  const handleAddMeasure = (plan) => {
    if (onNavigateToAddMeasure) {
      onNavigateToAddMeasure(plan.id);
    }
  };


  // 修改筹措举措
  const handleEditMeasure = (measure) => {
    if (onNavigateToEditMeasure) {
      // 找到该举措所属的计划ID
      const plan = procurementPlans.find(p => p.measures.some(m => m.id === measure.id));
      onNavigateToEditMeasure(measure.id, plan?.id);
    }
  };

  // 删除筹措举措
  const handleDeleteMeasure = (measure) => {
    setProcurementPlans(prev =>
      prev.map(plan => ({
        ...plan,
        measures: plan.measures.filter(m => m.id !== measure.id)
      }))
    );
    message.success('筹措举措删除成功！');
  };

  // 私有云采购与提拉数据表格列配置
  const procurementColumns = [
    {
      title: '套餐',
      dataIndex: 'package',
      key: 'package',
      width: 140,
      render: (text) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => (
        <Tag color={
          text === '通用型' ? 'default' :
          text === '计算型' ? 'processing' :
          text === '内存型' ? 'success' :
          text === '存储型' ? 'warning' : 'purple'
        }>
          {text}
        </Tag>
      )
    },
    {
      title: 'CPU核数',
      dataIndex: 'cpuCores',
      key: 'cpuCores',
      width: 100,
      sorter: (a, b) => a.cpuCores - b.cpuCores,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {value} 核
        </span>
      )
    },
    {
      title: '网卡配置',
      dataIndex: 'networkConfig',
      key: 'networkConfig',
      width: 120,
      render: (text) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      )
    },
    {
      title: '采购数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {value} 台
        </span>
      )
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 80,
      render: (text) => (
        <Tag color="geekblue">{text}</Tag>
      )
    },
    {
      title: '机房',
      dataIndex: 'datacenter',
      key: 'datacenter',
      width: 100,
      render: (text) => (
        <Tag color="cyan">{text}</Tag>
      )
    },
    {
      title: '机柜专区',
      dataIndex: 'cabinetZone',
      key: 'cabinetZone',
      width: 100,
      render: (text) => (
        <Tag color="orange">{text}</Tag>
      )
    },
    {
      title: '采购标识',
      dataIndex: 'procurementId',
      key: 'procurementId',
      width: 140,
      render: (text, record) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>
            {text}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
            {record.source}
          </div>
        </div>
      )
    },
    {
      title: '采购到货时间',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      width: 160,
      sorter: (a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime),
       render: (time, record) => (
         <div>
           <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
             {time}
           </div>
           <div style={{ marginTop: '2px' }}>
             <Tag color={
               record.status === '已到货' ? 'success' : 'processing'
             } size="small">
               {record.status}
             </Tag>
           </div>
         </div>
       )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewProcurementDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  // 处理私有云采购与提拉数据筛选
  const handleProcurementFilterChange = (changedValues, allValues) => {
    setProcurementFilters(allValues);
    // 这里可以添加实际的筛选逻辑
    console.log('筛选条件变更:', allValues);
  };

  // 重置筛选条件
  const handleResetProcurementFilters = () => {
    procurementFilterForm.resetFields();
    setProcurementFilters({
      package: [],
      type: [],
      cpuCores: [],
      region: [],
      datacenter: [],
      cabinetZone: [],
      arrivalTimeRange: null
    });
  };

  // 导出私有云采购与提拉数据
  const handleExportProcurementData = () => {
    message.success('导出功能开发中...');
  };

  // 刷新私有云采购与提拉数据
  const handleRefreshProcurementData = () => {
    setProcurementLoading(true);
    setTimeout(() => {
      setProcurementLoading(false);
      message.success('数据刷新成功！');
    }, 1000);
  };

  // 查看采购详情
  const handleViewProcurementDetail = (record) => {
    Modal.info({
      title: '采购详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}><strong>套餐:</strong></Col>
            <Col span={16}>{record.package}</Col>
            <Col span={8}><strong>类型:</strong></Col>
            <Col span={16}>{record.type}</Col>
            <Col span={8}><strong>CPU核数:</strong></Col>
            <Col span={16}>{record.cpuCores} 核</Col>
            <Col span={8}><strong>网卡配置:</strong></Col>
            <Col span={16}>{record.networkConfig}</Col>
            <Col span={8}><strong>采购数量:</strong></Col>
            <Col span={16}>{record.quantity} 台</Col>
            <Col span={8}><strong>地域:</strong></Col>
            <Col span={16}>{record.region}</Col>
            <Col span={8}><strong>机房:</strong></Col>
            <Col span={16}>{record.datacenter}</Col>
            <Col span={8}><strong>机柜专区:</strong></Col>
            <Col span={16}>{record.cabinetZone}</Col>
            <Col span={8}><strong>采购标识:</strong></Col>
            <Col span={16}>{record.procurementId}</Col>
            <Col span={8}><strong>到货时间:</strong></Col>
            <Col span={16}>{record.arrivalTime}</Col>
            <Col span={8}><strong>状态:</strong></Col>
             <Col span={16}>
               <Tag color={
                 record.status === '已到货' ? 'success' : 'processing'
               }>
                 {record.status}
               </Tag>
             </Col>
            <Col span={8}><strong>数据源:</strong></Col>
            <Col span={16}>{record.source}</Col>
          </Row>
        </div>
      )
    });
  };

  // 获取筛选后的数据
  const getFilteredProcurementData = () => {
    let filtered = [...procurementData];

    // 套餐筛选
    if (procurementFilters.package && procurementFilters.package.length > 0) {
      filtered = filtered.filter(item => procurementFilters.package.includes(item.package));
    }

    // 类型筛选
    if (procurementFilters.type && procurementFilters.type.length > 0) {
      filtered = filtered.filter(item => procurementFilters.type.includes(item.type));
    }

    // CPU核数筛选
    if (procurementFilters.cpuCores && procurementFilters.cpuCores.length > 0) {
      filtered = filtered.filter(item => procurementFilters.cpuCores.includes(item.cpuCores.toString()));
    }

    // 地域筛选
    if (procurementFilters.region && procurementFilters.region.length > 0) {
      filtered = filtered.filter(item => procurementFilters.region.includes(item.region));
    }

    // 机房筛选
    if (procurementFilters.datacenter && procurementFilters.datacenter.length > 0) {
      filtered = filtered.filter(item => procurementFilters.datacenter.includes(item.datacenter));
    }

    // 机柜专区筛选
    if (procurementFilters.cabinetZone && procurementFilters.cabinetZone.length > 0) {
      filtered = filtered.filter(item => procurementFilters.cabinetZone.includes(item.cabinetZone));
    }

    // 到货时间范围筛选
    if (procurementFilters.arrivalTimeRange && procurementFilters.arrivalTimeRange.length === 2) {
      const [startTime, endTime] = procurementFilters.arrivalTimeRange;
      filtered = filtered.filter(item => {
        const arrivalTime = new Date(item.arrivalTime);
        return arrivalTime >= startTime.toDate() && arrivalTime <= endTime.toDate();
      });
    }

    return filtered;
  };

  // 私有云提拉相关处理函数
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

  // 统一修改采购到货时间
  const handleBatchUpdateArrivalTime = () => {
    const expectedTime = measureForm.getFieldValue('expectedTime');
    if (!expectedTime) {
      message.warning('请先选择预计资源到位时间！');
      return;
    }

    if (selectedProcurementIds.length === 0) {
      message.warning('请先选择采购单！');
      return;
    }

    const newArrivalTime = expectedTime.format('YYYY-MM-DD HH:mm');

    // 更新选中采购单的到货时间
    setProcurementData(prev =>
      prev.map(item =>
        selectedProcurementIds.includes(item.id)
          ? { ...item, arrivalTime: newArrivalTime }
          : item
      )
    );

    message.success(`已将 ${selectedProcurementIds.length} 个采购单的到货时间更新为：${newArrivalTime}`);
  };

   // 筹措计划筛选处理函数
   const handlePlanFilterChange = (changedValues, allValues) => {
     setPlanFilters(allValues);
     console.log('筹措计划筛选条件变更:', allValues);
   };

   // 重置筹措计划筛选条件
   const handleResetPlanFilters = () => {
     setPlanFilters({
       status: [],
       datacenter: [],
       initiator: '',
       createTimeRange: null,
       resourceGapRange: [null, null]
     });
   };

   // 导出筹措计划数据
   const handleExportPlanData = () => {
     message.success('导出功能开发中...');
   };

   // 刷新筹措计划数据
   const handleRefreshPlanData = () => {
     setPlanLoading(true);
     setTimeout(() => {
       setPlanLoading(false);
       message.success('数据刷新成功！');
     }, 1000);
   };

   // 获取筛选后的筹措计划数据
   const getFilteredPlanData = () => {
     let filtered = [...procurementPlans];

     // 状态筛选
     if (planFilters.status && planFilters.status.length > 0) {
       filtered = filtered.filter(plan => planFilters.status.includes(plan.status));
     }

     // 机房筛选
     if (planFilters.datacenter && planFilters.datacenter.length > 0) {
       filtered = filtered.filter(plan => {
         const planDatacenters = Array.isArray(plan.datacenter) ? plan.datacenter : [plan.datacenter];
         return planFilters.datacenter.some(dc => planDatacenters.includes(dc));
       });
     }

     // 发起人筛选
     if (planFilters.initiator && planFilters.initiator.trim()) {
       filtered = filtered.filter(plan =>
         plan.initiator.toLowerCase().includes(planFilters.initiator.toLowerCase())
       );
     }

     // 创建时间范围筛选
     if (planFilters.createTimeRange && planFilters.createTimeRange.length === 2) {
       const [startTime, endTime] = planFilters.createTimeRange;
       filtered = filtered.filter(plan => {
         const createTime = new Date(plan.createTime);
         return createTime >= startTime.toDate() && createTime <= endTime.toDate();
       });
     }

     return filtered;
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
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingOutlined style={{ color: '#1890ff' }} />
              资源筹措管理
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              记录和管理已完成的资源筹措数据，维护筹措历史记录
            </p>
          </div>
          {activeTab === 'plans' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePlan}
            >
              添加筹措计划
            </Button>
          )}
        </div>
      </Card>

      {/* Tab 切换区域 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'plans',
              label: (
                <span>
                  <SettingOutlined />
                  筹措计划列表
                </span>
              ),
               children: (
                 <div>
                   {/* 筹措计划统计卡片 */}
                   <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                     <Col xs={24} sm={12} md={8}>
                       <Card size="small">
                         <Statistic
                           title="总计划资源缺口"
                           value={procurementPlans.reduce((sum, plan) => sum + plan.resourceGapMax, 0)}
                           suffix="核"
                           valueStyle={{ color: '#f5222d' }}
                           formatter={(value) => value.toLocaleString()}
                         />
                       </Card>
                     </Col>
                     <Col xs={24} sm={12} md={8}>
                       <Card size="small">
                         <Statistic
                           title="已筹备"
                           value={procurementPlans.reduce((sum, plan) => {
                             return sum + plan.measures.reduce((measureSum, measure) => {
                               return measureSum + measure.timePoints.reduce((pointSum, point) => {
                                 return pointSum + (point.actualAmount || 0);
                               }, 0);
                             }, 0);
                           }, 0)}
                           suffix="核"
                           valueStyle={{ color: '#52c41a' }}
                           formatter={(value) => value.toLocaleString()}
                         />
                       </Card>
                     </Col>
                     <Col xs={24} sm={12} md={8}>
                       <Card size="small">
                         <Statistic
                           title="待筹备/筹备中"
                           value={procurementPlans.reduce((sum, plan) => {
                             if (plan.status === '待筹备' || plan.status === '筹备中') {
                               return sum + plan.measures.reduce((measureSum, measure) => {
                                 return measureSum + measure.timePoints.reduce((pointSum, point) => {
                                   return pointSum + (point.expectedAmount - (point.actualAmount || 0));
                                 }, 0);
                               }, 0);
                             }
                             return sum;
                           }, 0)}
                           suffix="核"
                           valueStyle={{ color: '#faad14' }}
                           formatter={(value) => value.toLocaleString()}
                         />
                       </Card>
                     </Col>
                   </Row>

                   {/* 筹措计划筛选面板 */}
                   <Card size="small" style={{ marginBottom: 16 }}>
                     <Form
                       layout="inline"
                       onValuesChange={handlePlanFilterChange}
                       style={{ width: '100%' }}
                     >
                       <Row gutter={[16, 8]} style={{ width: '100%' }}>
                         <Col xs={24} sm={12} md={8} lg={6}>
                           <Form.Item name="status" label="计划状态" style={{ marginBottom: 8 }}>
                             <Select
                               mode="multiple"
                               placeholder="选择状态"
                               allowClear
                               style={{ width: '100%' }}
                               options={planStatusOptions.map(item => ({ value: item.value, label: item.label }))}
                             />
                           </Form.Item>
                         </Col>
                         <Col xs={24} sm={12} md={8} lg={6}>
                           <Form.Item name="datacenter" label="涉及机房" style={{ marginBottom: 8 }}>
                             <Select
                               mode="multiple"
                               placeholder="选择机房"
                               allowClear
                               style={{ width: '100%' }}
                               options={datacenterOptions}
                             />
                           </Form.Item>
                         </Col>
                         <Col xs={24} sm={12} md={8} lg={6}>
                           <Form.Item name="initiator" label="发起人" style={{ marginBottom: 8 }}>
                             <Input
                               placeholder="输入发起人"
                               allowClear
                               style={{ width: '100%' }}
                             />
                           </Form.Item>
                         </Col>
                         <Col xs={24} sm={12} md={8} lg={6}>
                           <Form.Item name="createTimeRange" label="创建时间" style={{ marginBottom: 8 }}>
                             <DatePicker.RangePicker
                               showTime={{ format: 'HH:mm' }}
                               format="YYYY-MM-DD HH:mm"
                               placeholder={['开始时间', '结束时间']}
                               style={{ width: '100%' }}
                             />
                           </Form.Item>
                         </Col>
                         <Col xs={24} sm={12} md={8} lg={6}>
                           <Form.Item style={{ marginBottom: 8 }}>
                             <Space>
                               <Button
                                 icon={<FilterOutlined />}
                                 onClick={handleResetPlanFilters}
                               >
                                 重置
                               </Button>
                               <Button
                                 icon={<ExportOutlined />}
                                 onClick={handleExportPlanData}
                               >
                                 导出
                               </Button>
                               <Button
                                 icon={<ReloadOutlined />}
                                 onClick={handleRefreshPlanData}
                                 loading={planLoading}
                               >
                                 刷新
                               </Button>
                             </Space>
                           </Form.Item>
                         </Col>
                       </Row>
                     </Form>
                   </Card>

                   <Table
                     columns={mainColumns}
                     dataSource={getFilteredPlanData()}
                     rowKey="id"
                     loading={planLoading}
                     expandable={{
                       expandedRowRender,
                       expandedRowKeys,
                       onExpand: handleExpand,
                       expandIcon: ({ expanded, onExpand, record }) => (
                         <Button
                           type="text"
                           size="small"
                           icon={expanded ? <DownOutlined /> : <RightOutlined />}
                           onClick={e => onExpand(record, e)}
                         />
                       )
                     }}
                     pagination={{
                       pageSize: 10,
                       showSizeChanger: true,
                       showQuickJumper: true,
                       showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                     }}
                     size="middle"
                   />
                 </div>
               )
            },
            {
              key: 'procurement',
              label: (
                <span>
                  <CloudServerOutlined />
                  私有云采购与提拉数据
                </span>
              ),
              children: (
                <div>
                  {/* 统计卡片 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Card size="small">
                        <Statistic
                          title="总物理机台数/总CPU核数"
                          value={`${procurementData.reduce((sum, item) => sum + item.quantity, 0)}台 / ${procurementData.reduce((sum, item) => sum + (item.cpuCores * item.quantity), 0)}核`}
                          valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Card size="small">
                        <Statistic
                          title="已到货物理机台数/已到货CPU核数"
                          value={`${procurementData.filter(item => item.status === '已到货').reduce((sum, item) => sum + item.quantity, 0)}台 / ${procurementData.filter(item => item.status === '已到货').reduce((sum, item) => sum + (item.cpuCores * item.quantity), 0)}核`}
                          valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Card size="small">
                        <Statistic
                          title="在途物理机台数/在途CPU核数"
                          value={`${procurementData.filter(item => item.status === '在途').reduce((sum, item) => sum + item.quantity, 0)}台 / ${procurementData.filter(item => item.status === '在途').reduce((sum, item) => sum + (item.cpuCores * item.quantity), 0)}核`}
                          valueStyle={{ color: '#faad14', fontSize: '16px' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* 筛选面板 */}
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form
                      form={procurementFilterForm}
                      layout="inline"
                      onValuesChange={handleProcurementFilterChange}
                      style={{ width: '100%' }}
                    >
                      <Row gutter={[16, 8]} style={{ width: '100%' }}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="package" label="套餐" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择套餐"
                              allowClear
                              style={{ width: '100%' }}
                              options={packageOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="type" label="Type" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择类型"
                              allowClear
                              style={{ width: '100%' }}
                              options={typeOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="cpuCores" label="CPU核数" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择核数"
                              allowClear
                              style={{ width: '100%' }}
                              options={cpuCoresOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="region" label="地域" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择地域"
                              allowClear
                              style={{ width: '100%' }}
                              options={regionOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="datacenter" label="机房" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择机房"
                              allowClear
                              style={{ width: '100%' }}
                              options={datacenterOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="cabinetZone" label="机柜专区" style={{ marginBottom: 8 }}>
                            <Select
                              mode="multiple"
                              placeholder="选择专区"
                              allowClear
                              style={{ width: '100%' }}
                              options={cabinetZoneOptions}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item name="arrivalTimeRange" label="到货时间" style={{ marginBottom: 8 }}>
                            <DatePicker.RangePicker
                              showTime={{ format: 'HH:mm' }}
                              format="YYYY-MM-DD HH:mm"
                              placeholder={['开始时间', '结束时间']}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Form.Item style={{ marginBottom: 8 }}>
                            <Space>
                              <Button
                                icon={<FilterOutlined />}
                                onClick={handleResetProcurementFilters}
                              >
                                重置
                              </Button>
                              <Button
                                icon={<ExportOutlined />}
                                onClick={handleExportProcurementData}
                              >
                                导出
                              </Button>
                              <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefreshProcurementData}
                                loading={procurementLoading}
                              >
                                刷新
                              </Button>
                            </Space>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Card>

                  {/* 数据表格 */}
                  <Table
                    columns={procurementColumns}
                    dataSource={getFilteredProcurementData()}
                    rowKey="id"
                    loading={procurementLoading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                    }}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              )
            }
          ]}
          size="large"
          tabBarStyle={{
            marginBottom: 24,
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </Card>

      {/* 创建筹措计划Modal */}
      <Modal
        title="添加筹措计划"
        open={createPlanModalVisible}
        onOk={handleCreatePlanSubmit}
        onCancel={() => setCreatePlanModalVisible(false)}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#52c41a', marginBottom: '4px' }}>
              📊 自动计算说明
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 资源缺口最大值 = 时间范围内全部需求量 - 全部库存量 - 现有筹措举措预计量级<br/>
              • 涉及机房将根据计算结果自动确定（英文缩写）<br/>
              • 计划状态默认为"待完善"
            </div>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gapStartTime"
                label="资源缺口开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择开始时间"
                  onChange={handleTimeChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gapEndTime"
                label="资源缺口结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择结束时间"
                  onChange={handleTimeChange}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 实时计算结果显示 */}
          {currentCalculation && (
            <div style={{
              backgroundColor: currentCalculation.resourceGapMax > 0 ? '#fff2e8' : '#f6ffed',
              border: `1px solid ${currentCalculation.resourceGapMax > 0 ? '#ffbb96' : '#b7eb8f'}`,
              borderRadius: '6px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                color: currentCalculation.resourceGapMax > 0 ? '#fa8c16' : '#52c41a',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                📊 实时计算结果
              </div>
              {currentCalculation.resourceGapMax > 0 ? (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f5222d', marginBottom: '8px' }}>
                    资源缺口最大值：{currentCalculation.resourceGapMax.toLocaleString()} 核
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    涉及机房：{currentCalculation.involvedDatacenters.map(dc => (
                      <Tag key={dc} color="blue" style={{ marginRight: '4px' }}>{dc}</Tag>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    各机房缺口详情：
                    {Object.entries(currentCalculation.datacenterGaps).map(([dc, gap]) => (
                      <span key={dc} style={{ marginRight: '12px' }}>
                        {dc}: {gap.toLocaleString()} 核
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '14px', color: '#52c41a', marginBottom: '4px' }}>
                    ✅ 该时间段内无资源缺口，可创建预防性筹措计划
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    即使无资源缺口，也可以创建筹措计划用于预防性资源储备或优化资源配置
                  </div>
                </div>
              )}
            </div>
          )}
        </Form>
      </Modal>

      {/* 修改计划状态Modal */}
      <Modal
        title="修改计划状态"
        open={editPlanModalVisible}
        onOk={handleEditPlanStatusSubmit}
        onCancel={() => setEditPlanModalVisible(false)}
        width={400}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editPlanForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="status"
            label="计划状态"
            rules={[{ required: true, message: '请选择计划状态' }]}
          >
            <Select>
              {planStatusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>


     </div>
   );
 };

 export default ResourceProcurementPage;
