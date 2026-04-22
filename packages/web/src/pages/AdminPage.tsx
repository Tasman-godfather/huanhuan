import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, Table, Button, Form, Input, Modal, Tag, message, Select, Image, Upload, Space, Card, Statistic, Row, Col } from 'antd';
import { CrownOutlined, AppstoreOutlined, TeamOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import api from '../lib/api';

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = (p?: number, q?: string) => {
    const pg = p ?? page;
    const kw = q ?? search;
    api.get('/admin/products', { params: { page: pg, pageSize: 15, q: kw || undefined } })
      .then(({ data }) => { setProducts(data.items); setTotal(data.total); })
      .catch((err) => {
        if (err.response?.status === 403) message.error('权限不足，请使用管理员账号登录 (admin@huanhuan.com)');
        else if (err.response?.status === 401) message.error('请先登录管理员账号');
        else message.error('加载失败');
      });
  };

  useEffect(() => { fetchProducts(page, search); }, [page]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {}); }, []);

  const openEdit = (product: any) => {
    setEditing(product);
    form.setFieldsValue({
      title: product.title,
      description: product.description?.replace(/<[^>]*>/g, '') || '',
      categoryId: product.categoryId,
      status: product.status,
      wantItems: product.wantItems || '',
      price: product.skus?.[0]?.price,
      originalPrice: product.skus?.[0]?.originalPrice,
      stock: product.skus?.[0]?.stock,
    });
    setFileList(
      (product.images || []).map((img: any, i: number) => ({
        uid: img.id || `-${i}`,
        name: `image-${i}`,
        status: 'done' as const,
        url: img.url,
        response: { url: img.url },
      }))
    );
    setEditModal(true);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('images', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess({ url: data[0].url }, file);
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const handleSave = async (values: any) => {
    if (!editing) return;
    setSaving(true);
    try {
      const images = fileList
        .filter(f => f.status === 'done')
        .map((f, i) => ({ url: f.response?.url || f.url, type: i === 0 ? 'main' : 'detail' }));

      await api.put(`/admin/products/${editing.id}`, {
        title: values.title,
        description: `<p>${values.description}</p>`,
        categoryId: values.categoryId,
        status: values.status,
        wantItems: values.wantItems,
        images,
        skus: [{
          specs: editing.skus?.[0]?.specs || { '默认': '默认' },
          price: Number(values.price),
          originalPrice: Number(values.originalPrice || values.price),
          stock: Number(values.stock),
        }],
      });
      message.success('商品已更新');
      setEditModal(false);
      fetchProducts();
    } catch { message.error('保存失败'); }
    finally { setSaving(false); }
  };

  const imgUrl = (url: string) => url;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Input.Search
          placeholder="搜索商品名称"
          allowClear
          onSearch={(v) => { setSearch(v); setPage(1); fetchProducts(1, v); }}
          style={{ width: 300 }}
        />
        <Tag color="blue" style={{ lineHeight: '32px' }}>共 {total} 个商品</Tag>
      </div>
      <Table
        dataSource={products}
        rowKey="id"
        pagination={{ current: page, total, pageSize: 15, onChange: setPage, showSizeChanger: false }}
        columns={[
          { title: '图片', width: 80, render: (_: any, r: any) => r.images?.[0] ? <Image src={imgUrl(r.images[0].url)} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-' },
          { title: '商品名称', dataIndex: 'title', ellipsis: true },
          { title: '商家', width: 120, render: (_: any, r: any) => r.shop?.name || '-' },
          { title: '分类', width: 80, render: (_: any, r: any) => r.category?.name || '-' },
          { title: '换贝价', width: 80, dataIndex: 'minPrice', render: (v: number) => `🪙${v?.toFixed(0)}` },
          { title: '库存', width: 60, render: (_: any, r: any) => r.skus?.[0]?.stock ?? '-' },
          { title: '状态', width: 80, dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '上架' : '下架'}</Tag> },
          { title: '操作', width: 80, render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button> },
        ]}
      />
      <Modal
        title={`编辑商品 - ${editing?.title || ''}`}
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={() => form.submit()}
        okText="保存"
        confirmLoading={saving}
        width={700}
      >
        <div style={{ marginBottom: 12, color: '#999', fontSize: 12 }}>
          商家: {editing?.shop?.seller?.companyName || editing?.shop?.name} | ID: {editing?.id?.slice(0, 8)}
        </div>
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="title" label="商品标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="商品描述"><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
                <Select>
                  {categories.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="active">上架</Select.Option>
                  <Select.Option value="inactive">下架</Select.Option>
                  <Select.Option value="draft">草稿</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="price" label="换贝价格" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={8}><Form.Item name="originalPrice" label="市场参考价"><Input type="number" /></Form.Item></Col>
            <Col span={8}><Form.Item name="stock" label="库存数量"><Input type="number" /></Form.Item></Col>
          </Row>
          <Form.Item name="wantItems" label="想换取的商品"><Input /></Form.Item>
          <Form.Item label="商品图片（拖拽排序，第一张为主图）">
            <Upload
              customRequest={handleUpload}
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept="image/*"
              multiple
            >
              {fileList.length >= 8 ? null : <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 12 }}>上传</div></div>}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  useEffect(() => {
    api.get('/admin/merchants').then(({ data }) => setMerchants(data)).catch(() => message.error('加载失败'));
  }, []);

  return (
    <Table dataSource={merchants} rowKey="id" columns={[
      { title: '昵称', dataIndex: 'nickname' },
      { title: '企业名称', dataIndex: 'companyName' },
      { title: '邮箱', dataIndex: 'email' },
      { title: '手机', dataIndex: 'phone' },
      { title: '换贝余额', dataIndex: 'huanbeiBalance', render: (v: number) => `🪙${v?.toFixed(0)}` },
      { title: '押金', dataIndex: 'depositAmount', render: (v: number) => `¥${v?.toFixed(0)}` },
      { title: '注册时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    ]} />
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, merchants: 0 });
  const [hasAccess, setHasAccess] = useState(true);
  useEffect(() => {
    Promise.all([
      api.get('/admin/products', { params: { pageSize: 1 } }),
      api.get('/admin/merchants'),
    ]).then(([p, m]) => {
      setStats({ products: p.data.total, merchants: m.data.length });
    }).catch(() => setHasAccess(false));
  }, []);
  if (!hasAccess) return (
    <Card style={{ textAlign: 'center', padding: 40 }}>
      <CrownOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
      <h3>管理员权限不足</h3>
      <p style={{ color: '#999' }}>请使用管理员账号登录后再访问此页面</p>
      <p style={{ color: '#999', fontSize: 12 }}>账号: admin@huanhuan.com / 密码: 123456</p>
      <Link to="/login"><Button type="primary">去登录</Button></Link>
    </Card>
  );
  return (
    <Row gutter={16}>
      <Col span={8}><Card><Statistic title="总商品数" value={stats.products} /></Card></Col>
      <Col span={8}><Card><Statistic title="商家数量" value={stats.merchants} /></Card></Col>
      <Col span={8}><Card><Statistic title="管理权限" value="超级管理员" valueStyle={{ fontSize: 16, color: '#FF4400' }} /></Card></Col>
    </Row>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const path = location.pathname.replace('/admin', '') || '/dashboard';

  return (
    <div style={{ maxWidth: 1400, margin: '24px auto', padding: '0 24px', display: 'flex', gap: 24 }}>
      <div style={{ width: 200 }}>
        <div style={{ padding: '12px 16px', background: '#FFF7E6', borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
          <CrownOutlined style={{ fontSize: 24, color: '#FF4400' }} />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>管理后台</div>
        </div>
        <Menu selectedKeys={[path]} mode="vertical" items={[
          { key: '/dashboard', icon: <CrownOutlined />, label: <Link to="/admin/dashboard">控制台</Link> },
          { key: '/products', icon: <AppstoreOutlined />, label: <Link to="/admin/products">商品管理</Link> },
          { key: '/merchants', icon: <TeamOutlined />, label: <Link to="/admin/merchants">商家管理</Link> },
        ]} />
      </div>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="merchants" element={<AdminMerchants />} />
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
