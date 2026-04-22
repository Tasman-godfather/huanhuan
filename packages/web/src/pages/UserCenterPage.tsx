import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, Card, Tabs, Table, Tag, Button, Empty, message, Form, Input, InputNumber, List, Statistic, Row, Col, Modal, Badge } from 'antd';
import { UserOutlined, SwapOutlined, HeartOutlined, SettingOutlined, BellOutlined, WalletOutlined, InteractionOutlined } from '@ant-design/icons';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import ExchangeModal from '../components/ExchangeModal';

function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  useEffect(() => {
    api.get('/orders', { params: { status: status || undefined } }).then(({ data }) => setOrders(data.items));
  }, [status]);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending_confirm: { label: '待确认', color: 'orange' },
    pending_shipment: { label: '待发货', color: 'blue' },
    shipped: { label: '运输中', color: 'cyan' },
    completed: { label: '已完成', color: 'green' },
    cancelled: { label: '已取消', color: 'default' },
  };

  return (
    <div>
      <Tabs activeKey={status} onChange={setStatus} items={[
        { key: '', label: '全部' },
        { key: 'pending_confirm', label: '待确认' },
        { key: 'pending_shipment', label: '待发货' },
        { key: 'shipped', label: '运输中' },
        { key: 'completed', label: '已完成' },
      ]} />
      {orders.length === 0 ? <Empty description="暂无交换记录" /> : orders.map((o) => (
        <Card key={o.id} size="small" style={{ marginBottom: 8 }}
          title={<><span style={{ color: '#999' }}>交换单号: {o.orderNo}</span> <Tag color={statusMap[o.status]?.color}>{statusMap[o.status]?.label}</Tag></>}
          extra={<span style={{ color: '#FF4400', fontWeight: 700 }}>🪙{o.payableAmount.toFixed(0)} 换贝</span>}>
          {o.orderItems?.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span>{item.productSnapshot?.title}</span>
              <span style={{ color: '#999' }}>x{item.quantity}</span>
            </div>
          ))}
          {o.status === 'shipped' && <Button size="small" type="primary" onClick={async () => {
            await api.patch(`/orders/${o.id}/confirm`);
            message.success('已确认收货');
          }}>确认收货</Button>}
        </Card>
      ))}
    </div>
  );
}

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [form] = Form.useForm();
  useEffect(() => { if (user) form.setFieldsValue(user); }, [user]);

  const save = async (values: any) => {
    await api.put('/user/profile', values);
    message.success('已保存');
  };

  return (
    <Form form={form} onFinish={save} layout="vertical" style={{ maxWidth: 400 }}>
      <Form.Item name="nickname" label="联系人名称"><Input /></Form.Item>
      <Form.Item name="companyName" label="企业名称"><Input /></Form.Item>
      <Form.Item name="gender" label="性别">
        <Input placeholder="male / female / other" />
      </Form.Item>
      <Form.Item><Button type="primary" htmlType="submit">保存</Button></Form.Item>
    </Form>
  );
}

function HuanbeiPage() {
  const { user, fetchProfile } = useAuthStore();
  const [rechargeAmount, setRechargeAmount] = useState(10000);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    api.get('/user/huanbei/records').then(({ data }) => setRecords(data.items || [])).catch(() => {});
  }, []);

  const handleRecharge = async () => {
    setLoading(true);
    try {
      await api.post('/user/huanbei/recharge', { amount: rechargeAmount });
      message.success(`成功充值 ${rechargeAmount.toLocaleString()} 换贝`);
      fetchProfile();
      api.get('/user/huanbei/records').then(({ data }) => setRecords(data.items || []));
    } catch {
      message.error('充值失败');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="换贝余额" value={user?.huanbeiBalance || 0} prefix="🪙" suffix="换贝" valueStyle={{ color: '#FF4400' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已缴押金" value={user?.depositAmount || 0} prefix="¥" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="交易记录" value={records.length} suffix="条" />
          </Card>
        </Col>
      </Row>

      <Card title="充值换贝" style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', marginBottom: 16 }}>1换贝 = 1元人民币，充值后可用于支付交换手续费</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[10000, 50000, 100000, 200000].map((amount) => (
            <Button key={amount} type={rechargeAmount === amount ? 'primary' : 'default'}
              onClick={() => setRechargeAmount(amount)}>
              {amount.toLocaleString()} 换贝
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <span>自定义金额:</span>
          <InputNumber min={100} step={1000} value={rechargeAmount}
            onChange={(v) => v && setRechargeAmount(v)} style={{ width: 200 }} />
          <span style={{ color: '#999' }}>换贝</span>
        </div>
        <Button type="primary" size="large" onClick={handleRecharge} loading={loading}>
          立即充值 ¥{rechargeAmount.toLocaleString()}
        </Button>
      </Card>

      {records.length > 0 && (
        <Card title="换贝变动记录" style={{ marginBottom: 16 }}>
          <Table dataSource={records} rowKey="id" pagination={{ pageSize: 10 }} columns={[
            { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
            { title: '类型', dataIndex: 'type', render: (t: string) => {
              const m: Record<string, string> = { deposit: '押金', recharge: '充值', service_fee: '手续费', exchange_fee: '易货手续费', refund: '退还' };
              return m[t] || t;
            }},
            { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>{v >= 0 ? '+' : ''}{v} 换贝</span> },
            { title: '说明', dataIndex: 'remark' },
          ]} />
        </Card>
      )}

      <Card title="换贝规则说明">
        <p>• 入驻需缴纳最低 <b>10,000元押金</b>，自动兑换为 <b>10,000换贝</b></p>
        <p>• 换贝与人民币 <b>1:1</b> 等值兑换</p>
        <p>• 每次交换，双方各扣除商品价值的 <b>5%</b> 作为手续费</p>
        <p>• 单次交换价值超过 <b>200,000换贝</b>（手续费10,000换贝以上），需提前充值</p>
        <p>• 押金可在退出平台时申请退还（扣除未结手续费）</p>
      </Card>
    </div>
  );
}

function FavoritesPage() {
  const [favs, setFavs] = useState<any[]>([]);
  useEffect(() => { api.get('/user/favorites').then(({ data }) => setFavs(data)); }, []);
  return favs.length === 0 ? <Empty description="暂无收藏" /> : (
    <List dataSource={favs} renderItem={(f: any) => (
      <List.Item actions={[<Button danger size="small" onClick={async () => {
        await api.delete(`/user/favorites/${f.id}`);
        setFavs(favs.filter((x) => x.id !== f.id));
      }}>取消收藏</Button>]}>
        <List.Item.Meta title={<Link to={f.type === 'product' ? `/product/${f.targetId}` : '#'}>{f.targetId}</Link>} description={f.type} />
      </List.Item>
    )} />
  );
}

function SecurityPage() {
  const [form] = Form.useForm();
  const save = async (values: any) => {
    try {
      await api.post('/auth/reset-password', { target: values.email, type: 'email', code: '000000', newPassword: values.newPassword });
      message.success('密码已修改');
      form.resetFields();
    } catch { message.error('修改失败'); }
  };
  return (
    <div>
      <h3>修改密码</h3>
      <Form form={form} onFinish={save} layout="vertical" style={{ maxWidth: 400 }}>
        <Form.Item name="email" label="邮箱"><Input /></Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
        <Form.Item><Button type="primary" htmlType="submit">修改密码</Button></Form.Item>
      </Form>
    </div>
  );
}

function MessageCenter() {
  return (
    <div>
      <Tabs items={[
        { key: 'system', label: '系统通知', children: <Empty description="暂无系统通知" /> },
        { key: 'exchange', label: '交换消息', children: <Empty description="暂无交换消息" /> },
        { key: 'huanbei', label: '换贝变动', children: <Empty description="暂无换贝变动记录" /> },
      ]} />
    </div>
  );
}

function ExchangeManagement() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('all');
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [counterModal, setCounterModal] = useState<{ id: string; targetValue: number } | null>(null);
  const [counterValue, setCounterValue] = useState(0);
  const [counterMsg, setCounterMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState<string | null>(null);

  const fetchExchanges = () => {
    setLoading(true);
    const role = tab === 'sent' ? 'initiator' : tab === 'received' ? 'receiver' : 'all';
    api.get('/exchanges', { params: { role } })
      .then(({ data }) => { setExchanges(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExchanges(); }, [tab]);

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待确认', color: 'orange' },
    negotiating: { label: '议价中', color: 'blue' },
    accepted: { label: '已接受', color: 'cyan' },
    rejected: { label: '已拒绝', color: 'red' },
    cancelled: { label: '已取消', color: 'default' },
    completed: { label: '已完成', color: 'green' },
  };

  const handleAccept = async (id: string) => {
    try {
      await api.patch(`/exchanges/${id}/accept`);
      message.success('交换已完成！双方已扣除手续费');
      fetchExchanges();
    } catch (err: any) { message.error(err.response?.data?.message || '操作失败'); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/exchanges/${id}/reject`);
      message.success('已拒绝');
      fetchExchanges();
    } catch (err: any) { message.error(err.response?.data?.message || '操作失败'); }
  };

  const handleCounter = async () => {
    if (!counterModal) return;
    try {
      await api.patch(`/exchanges/${counterModal.id}/counter`, { requestedValue: counterValue, message: counterMsg });
      message.success('还价已发送');
      setCounterModal(null);
      fetchExchanges();
    } catch (err: any) { message.error(err.response?.data?.message || '操作失败'); }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/exchanges/${id}/cancel`);
      message.success('已取消');
      fetchExchanges();
    } catch (err: any) { message.error(err.response?.data?.message || '操作失败'); }
  };

  const handleConfirmCounter = async (id: string, offeredItems: any[]) => {
    try {
      await api.patch(`/exchanges/${id}/confirm`, { offeredItems });
      message.success('已重新提交，等待对方确认');
      setConfirmModal(null);
      fetchExchanges();
    } catch (err: any) { message.error(err.response?.data?.message || '操作失败'); }
  };

  return (
    <div>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'all', label: '全部' },
        { key: 'sent', label: '我发起的' },
        { key: 'received', label: '我收到的' },
      ]} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div> :
        exchanges.length === 0 ? <Empty description="暂无易货记录" /> :
        exchanges.map((ex) => {
          const isInitiator = ex.initiatorId === user?.id;
          const isReceiver = ex.receiverId === user?.id;
          const offeredItems = ex.offeredItems as any[];
          const st = statusMap[ex.status] || { label: ex.status, color: 'default' };

          return (
            <Card key={ex.id} size="small" style={{ marginBottom: 12 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={st.color}>{st.label}</Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {isInitiator ? '我发起' : '收到'} · {new Date(ex.createdAt).toLocaleString()}
                  </span>
                </div>
              }
            >
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>目标商品:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ex.targetProduct?.images?.[0] && <img src={ex.targetProduct.images[0].url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />}
                    <div>
                      <div style={{ fontWeight: 500 }}>{ex.targetProduct?.title}</div>
                      <div style={{ color: '#FF4400', fontWeight: 600 }}>¥{ex.targetValue.toFixed(0)} 换贝 × {ex.targetQuantity}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#FF4400' }}>⇄</div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>交换商品:</div>
                  {offeredItems.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {item.image && <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />}
                      <div>
                        <div style={{ fontSize: 13 }}>{item.title}</div>
                        <div style={{ color: '#FF4400', fontSize: 12 }}>¥{item.price} × {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ color: '#333', fontWeight: 600, marginTop: 4 }}>合计: ¥{ex.offeredValue.toFixed(0)} 换贝</div>
                </div>
              </div>

              {ex.counterOffer && (
                <div style={{ marginTop: 12, padding: 8, background: '#FFF7E6', borderRadius: 4 }}>
                  <span style={{ fontWeight: 600 }}>还价:</span> 要求 ¥{(ex.counterOffer as any).requestedValue} 换贝
                  {(ex.counterOffer as any).message && <span style={{ marginLeft: 8, color: '#666' }}>"{(ex.counterOffer as any).message}"</span>}
                </div>
              )}

              {ex.status === 'completed' && (
                <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                  手续费: 发起方 ¥{ex.initiatorFee} + 接收方 ¥{ex.receiverFee}
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {isReceiver && ex.status === 'pending' && (
                  <>
                    <Button type="primary" size="small" onClick={() => handleAccept(ex.id)}>接受交换</Button>
                    <Button size="small" onClick={() => { setCounterModal({ id: ex.id, targetValue: ex.targetValue }); setCounterValue(ex.offeredValue); setCounterMsg(''); }}>还价</Button>
                    <Button danger size="small" onClick={() => handleReject(ex.id)}>拒绝</Button>
                  </>
                )}
                {isInitiator && ex.status === 'negotiating' && (
                  <>
                    <Button type="primary" size="small" onClick={() => setConfirmModal(ex.id)}>调整商品重新提交</Button>
                    <Button danger size="small" onClick={() => handleCancel(ex.id)}>取消</Button>
                  </>
                )}
                {isInitiator && ['pending'].includes(ex.status) && (
                  <Button danger size="small" onClick={() => handleCancel(ex.id)}>取消</Button>
                )}
              </div>
            </Card>
          );
        })
      }

      <Modal title="还价" open={!!counterModal} onOk={handleCounter} onCancel={() => setCounterModal(null)} okText="发送还价">
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4 }}>要求对方提供的商品价值 (换贝):</div>
          <InputNumber value={counterValue} onChange={v => v && setCounterValue(v)} min={1} style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ marginBottom: 4 }}>留言:</div>
          <Input.TextArea value={counterMsg} onChange={e => setCounterMsg(e.target.value)} placeholder="说明还价原因..." rows={2} />
        </div>
      </Modal>

      {confirmModal && (
        <ConfirmCounterModal
          exchangeId={confirmModal}
          onClose={() => { setConfirmModal(null); fetchExchanges(); }}
          onConfirm={handleConfirmCounter}
        />
      )}
    </div>
  );
}

function ConfirmCounterModal({ exchangeId, onClose, onConfirm }: {
  exchangeId: string;
  onClose: () => void;
  onConfirm: (id: string, items: any[]) => void;
}) {
  const [exchange, setExchange] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<Map<string, { productId: string; skuId: string; quantity: number; price: number; maxQty: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/exchanges/${exchangeId}`),
      api.get('/seller/products'),
    ]).then(([exRes, prodRes]) => {
      setExchange(exRes.data);
      const active = (prodRes.data.items || prodRes.data).filter((p: any) => p.status === 'active' && p.skus?.length > 0);
      setProducts(active);
    }).finally(() => setLoading(false));
  }, [exchangeId]);

  const toggleProduct = (product: any) => {
    const next = new Map(selected);
    const sku = product.skus[0];
    if (next.has(sku.id)) next.delete(sku.id);
    else next.set(sku.id, { productId: product.id, skuId: sku.id, quantity: 1, price: sku.price, maxQty: sku.stock });
    setSelected(next);
  };

  const offeredValue = Array.from(selected.values()).reduce((s, i) => s + i.price * i.quantity, 0);
  const requestedValue = exchange?.counterOffer?.requestedValue || 0;

  return (
    <Modal title="调整交换商品" open width={640} onCancel={onClose}
      onOk={() => {
        const items = Array.from(selected.values()).map(i => ({ productId: i.productId, skuId: i.skuId, quantity: i.quantity }));
        onConfirm(exchangeId, items);
      }}
      okText="确认提交"
    >
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div> : (
        <>
          <div style={{ background: '#FFF7E6', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            对方要求的商品价值: <span style={{ color: '#FF4400', fontWeight: 700, fontSize: 18 }}>¥{requestedValue}</span> 换贝
          </div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>当前出价: <span style={{ color: '#FF4400', fontWeight: 700 }}>¥{offeredValue.toFixed(0)}</span> 换贝</span>
            <Tag color={Math.abs(offeredValue - requestedValue) <= requestedValue * 0.1 ? 'green' : offeredValue < requestedValue ? 'orange' : 'blue'}>
              {offeredValue >= requestedValue ? '满足要求' : `差 ${(requestedValue - offeredValue).toFixed(0)}`}
            </Tag>
          </div>
          {products.map(p => {
            const sku = p.skus[0];
            const isSelected = selected.has(sku.id);
            const item = selected.get(sku.id);
            return (
              <div key={p.id} onClick={() => toggleProduct(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, marginBottom: 6, border: `2px solid ${isSelected ? '#FF4400' : '#f0f0f0'}`, borderRadius: 6, cursor: 'pointer', background: isSelected ? '#FFF5F0' : '#fff' }}>
                <input type="checkbox" checked={isSelected} readOnly />
                <img src={p.images?.[0]?.url || ''} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{p.title}</div>
                  <div style={{ color: '#FF4400', fontWeight: 600 }}>¥{sku.price.toFixed(0)} 换贝</div>
                </div>
                {isSelected && (
                  <div onClick={e => e.stopPropagation()}>
                    <InputNumber min={1} max={item?.maxQty || sku.stock} value={item?.quantity || 1}
                      onChange={v => { if (v) { const n = new Map(selected); const it = n.get(sku.id)!; it.quantity = v; n.set(sku.id, { ...it }); setSelected(n); } }}
                      size="small" style={{ width: 65 }} />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </Modal>
  );
}

export default function UserCenterPage() {
  const location = useLocation();
  const path = location.pathname.replace('/user', '') || '/orders';

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', display: 'flex', gap: 24 }}>
      <div style={{ width: 200 }}>
        <Menu selectedKeys={[path]} mode="vertical" items={[
          { key: '/orders', icon: <SwapOutlined />, label: <Link to="/user/orders">我的交换</Link> },
          { key: '/exchanges', icon: <InteractionOutlined />, label: <Link to="/user/exchanges">我的易货</Link> },
          { key: '/huanbei', icon: <WalletOutlined />, label: <Link to="/user/huanbei">换贝账户</Link> },
          { key: '/profile', icon: <UserOutlined />, label: <Link to="/user/profile">企业信息</Link> },
          { key: '/favorites', icon: <HeartOutlined />, label: <Link to="/user/favorites">收藏夹</Link> },
          { key: '/messages', icon: <BellOutlined />, label: <Link to="/user/messages">消息中心</Link> },
          { key: '/settings', icon: <SettingOutlined />, label: <Link to="/user/settings">账户安全</Link> },
        ]} />
      </div>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="orders" element={<OrderList />} />
          <Route path="exchanges" element={<ExchangeManagement />} />
          <Route path="huanbei" element={<HuanbeiPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="messages" element={<MessageCenter />} />
          <Route path="settings" element={<SecurityPage />} />
          <Route path="*" element={<OrderList />} />
        </Routes>
      </div>
    </div>
  );
}
