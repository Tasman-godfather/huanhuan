import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, Card, Statistic, Row, Col, Table, Button, Form, Input, Modal, Tag, message, Tabs, Select, Upload } from 'antd';
import { ShopOutlined, AppstoreOutlined, SwapOutlined, BarChartOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import api from '../lib/api';

function Dashboard() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.get('/seller/analytics').then(({ data }) => setStats(data)).catch(() => {}); }, []);
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="总交换单" value={stats.totalOrders || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="交换总价值" value={stats.totalRevenue || 0} prefix="🪙" precision={0} suffix="换贝" /></Card></Col>
        <Col span={6}><Card><Statistic title="上架商品" value={stats.totalProducts || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="交换成功率" value={stats.conversionRate || 0} suffix="%" /></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <h4>交换规则说明</h4>
        <p>• 所有商品以换贝标价，1换贝 = 1元人民币</p>
        <p>• 每次交换双方各扣5%手续费</p>
        <p>• 入驻押金最低10,000元，兑换10,000换贝</p>
        <p>• 单次交换超过200,000换贝需充值足够换贝</p>
      </Card>
    </div>
  );
}

function ProductManage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = () => {
    api.get('/seller/products').then(({ data }) => setProducts(data.items)).catch(() => {});
  };
  useEffect(() => {
    fetchProducts();
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('images', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploadedUrl = data[0].url;
      onSuccess({ url: uploadedUrl }, file);
    } catch (err) {
      onError(err);
      message.error('图片上传失败');
    }
  };

  const publish = async (values: any) => {
    setUploading(true);
    try {
      const images = fileList
        .filter(f => f.status === 'done')
        .map((f, i) => ({ url: f.response?.url || f.url, type: i === 0 ? 'main' : 'detail' }));
      if (values.imageUrl) images.push({ url: values.imageUrl, type: images.length === 0 ? 'main' : 'detail' });

      await api.post('/products', {
        ...values,
        skus: [{ specs: { '默认': '默认' }, price: Number(values.price), originalPrice: Number(values.originalPrice || values.price), stock: Number(values.stock) }],
        images,
      });
      message.success('商品发布成功');
      setShowModal(false);
      form.resetFields();
      setFileList([]);
      fetchProducts();
    } catch { message.error('发布失败'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <Button type="primary" onClick={() => setShowModal(true)} style={{ marginBottom: 16 }}>发布商品</Button>
      <Table dataSource={products} rowKey="id" columns={[
        { title: '图片', dataIndex: 'images', width: 60, render: (_: any, r: any) => r.images?.[0] ? <img src={r.images[0].url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '商品名称', dataIndex: 'title' },
        { title: '换贝价', dataIndex: 'minPrice', render: (v: number) => `🪙${v.toFixed(0)}` },
        { title: '交换量', dataIndex: 'salesCount' },
        { title: '库存', dataIndex: 'stock', render: (_: any, r: any) => r.skus?.[0]?.stock ?? '-' },
        { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '上架中' : '已下架'}</Tag> },
        { title: '操作', render: (_: any, r: any) => (
          <Button size="small" onClick={async () => {
            await api.patch(`/products/${r.id}/status`, { status: r.status === 'active' ? 'inactive' : 'active' });
            fetchProducts();
          }}>{r.status === 'active' ? '下架' : '上架'}</Button>
        )},
      ]} />
      <Modal title="发布商品" open={showModal} onCancel={() => { setShowModal(false); setFileList([]); }} onOk={() => form.submit()} okText="发布" confirmLoading={uploading} width={600}>
        <Form form={form} onFinish={publish} layout="vertical">
          <Form.Item name="title" label="商品标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="商品描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="categoryId" label="商品分类" rules={[{ required: true }]}>
            <Select placeholder="请选择分类">
              {categories.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.icon} {c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="换贝价格" rules={[{ required: true }]}>
            <Input type="number" prefix="🪙" suffix="换贝" />
          </Form.Item>
          <Form.Item name="originalPrice" label="市场参考价（换贝）"><Input type="number" /></Form.Item>
          <Form.Item name="stock" label="可换数量" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="wantItems" label="想换取的商品（如：白酒、大米、电子产品等）">
            <Input placeholder="填写您希望换取的商品类型" />
          </Form.Item>
          <Form.Item label="商品图片（可上传多张，第一张为主图）">
            <Upload
              customRequest={handleUpload}
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept="image/*"
              multiple
            >
              {fileList.length >= 5 ? null : (
                <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 12 }}>上传图片</div></div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="imageUrl" label="或粘贴图片URL（可选）"><Input placeholder="https://..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const fetchOrders = () => {
    api.get('/seller/orders', { params: { status: status || undefined } }).then(({ data }) => setOrders(data.items)).catch(() => {});
  };
  useEffect(fetchOrders, [status]);

  return (
    <div>
      <Tabs activeKey={status} onChange={setStatus} items={[
        { key: '', label: '全部' }, { key: 'pending_confirm', label: '待确认' },
        { key: 'pending_shipment', label: '待发货' },
        { key: 'shipped', label: '已发货' }, { key: 'completed', label: '已完成' },
      ]} />
      <Table dataSource={orders} rowKey="id" columns={[
        { title: '交换单号', dataIndex: 'orderNo' },
        { title: '对方商家', dataIndex: ['buyer', 'nickname'] },
        { title: '交换价值', dataIndex: 'payableAmount', render: (v: number) => `🪙${v.toFixed(0)} 换贝` },
        { title: '手续费', dataIndex: 'serviceFee', render: (v: number) => `🪙${(v || 0).toFixed(0)}` },
        { title: '状态', dataIndex: 'status', render: (s: string) => {
          const map: Record<string, string> = { pending_confirm: '待确认', pending_shipment: '待发货', shipped: '运输中', completed: '已完成' };
          return map[s] || s;
        }},
        { title: '操作', render: (_: any, r: any) => r.status === 'pending_shipment' && (
          <Button size="small" type="primary" onClick={async () => {
            await api.patch(`/orders/${r.id}/ship`, { carrier: '顺丰', trackingNo: `SF${Date.now()}` });
            message.success('已发货');
            fetchOrders();
          }}>发货</Button>
        )},
      ]} />
    </div>
  );
}

function ShopSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api.get('/seller/shop').then(({ data }) => form.setFieldsValue(data)).catch(() => {});
  }, []);
  const save = async (values: any) => {
    setLoading(true);
    try { await api.put('/seller/shop', values); message.success('已保存'); } catch { message.error('保存失败'); }
    finally { setLoading(false); }
  };
  return (
    <Form form={form} onFinish={save} layout="vertical" style={{ maxWidth: 500 }}>
      <Form.Item name="name" label="企业/店铺名称" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="logo" label="Logo URL"><Input /></Form.Item>
      <Form.Item name="description" label="企业简介/经营范围"><Input.TextArea rows={3} /></Form.Item>
      <Form.Item><Button type="primary" htmlType="submit" loading={loading}>保存</Button></Form.Item>
    </Form>
  );
}

export default function SellerCenterPage() {
  const location = useLocation();
  const path = location.pathname.replace('/seller', '') || '/dashboard';

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', display: 'flex', gap: 24 }}>
      <div style={{ width: 200 }}>
        <Menu selectedKeys={[path]} mode="vertical" items={[
          { key: '/dashboard', icon: <BarChartOutlined />, label: <Link to="/seller/dashboard">数据概览</Link> },
          { key: '/products', icon: <AppstoreOutlined />, label: <Link to="/seller/products">商品管理</Link> },
          { key: '/orders', icon: <SwapOutlined />, label: <Link to="/seller/orders">交换订单</Link> },
          { key: '/shop', icon: <ShopOutlined />, label: <Link to="/seller/shop">企业设置</Link> },
        ]} />
      </div>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManage />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="shop" element={<ShopSettings />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
