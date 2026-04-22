import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Radio, Button, message, Divider, Modal, Form, Input, Tag, Alert } from 'antd';
import { EnvironmentOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../lib/api';

interface Address { id: string; name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean; }
interface CartItem { id: string; quantity: number; selected: boolean; sku: { price: number; specs: Record<string, string> }; product: { title: string; image?: string }; }
interface ShopGroup { shop: { id: string; name: string }; items: CartItem[]; }

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [cartGroups, setCartGroups] = useState<ShopGroup[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/addresses').then(({ data }) => {
      setAddresses(data);
      const def = data.find((a: Address) => a.isDefault) || data[0];
      if (def) setSelectedAddr(def.id);
    });
    api.get('/cart').then(({ data }) => setCartGroups(data));
  }, []);

  const selectedItems = cartGroups.flatMap((g) => g.items).filter((i) => i.selected);
  const itemTotal = selectedItems.reduce((s, i) => s + i.sku.price * i.quantity, 0);
  const shippingFee = itemTotal >= 99 ? 0 : 10;
  const serviceFee = Math.ceil(itemTotal * 0.05);
  const totalAmount = itemTotal + shippingFee;

  const submitOrder = async () => {
    if (!selectedAddr) { message.warning('请选择收货地址'); return; }
    if (selectedItems.length === 0) { message.warning('没有选中的商品'); return; }
    setLoading(true);
    try {
      const { data: orders } = await api.post('/orders', {
        addressId: selectedAddr,
        cartItemIds: selectedItems.map((i) => i.id),
      });
      for (const order of orders) {
        await api.post('/payments', { orderId: order.id, method: 'huanbei' });
      }
      message.success('交换申请已提交！');
      navigate('/user/orders');
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败');
    } finally { setLoading(false); }
  };

  const addAddress = async (values: any) => {
    await api.post('/addresses', values);
    const { data } = await api.get('/addresses');
    setAddresses(data);
    setShowAddrModal(false);
    form.resetFields();
  };

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 24px' }}>
      <h2>🔄 确认交换</h2>

      <Alert
        message="交换说明"
        description="发起交换后，平台将从双方各扣除商品价值5%的换贝作为手续费。请确保换贝余额充足。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title={<><EnvironmentOutlined /> 收货地址</>} extra={<Button type="link" onClick={() => setShowAddrModal(true)}>新增地址</Button>} style={{ marginBottom: 16 }}>
        {addresses.length === 0 ? <div style={{ color: '#999' }}>暂无地址，请新增</div> : (
          <Radio.Group value={selectedAddr} onChange={(e) => setSelectedAddr(e.target.value)} style={{ width: '100%' }}>
            {addresses.map((a) => (
              <Radio key={a.id} value={a.id} style={{ display: 'block', marginBottom: 8, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span> <span style={{ color: '#666' }}>{a.phone}</span>
                <span style={{ marginLeft: 12, color: '#333' }}>{a.province}{a.city}{a.district} {a.detail}</span>
                {a.isDefault && <Tag color="#FF4400" style={{ marginLeft: 8 }}>默认</Tag>}
              </Radio>
            ))}
          </Radio.Group>
        )}
      </Card>

      <Card title="交换商品清单" style={{ marginBottom: 16 }}>
        {cartGroups.map((g) => (
          <div key={g.shop.id} style={{ marginBottom: 12 }}>
            <div style={{ color: '#666', marginBottom: 8 }}><ShopOutlined /> {g.shop.name}</div>
            {g.items.filter((i) => i.selected).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid #f9f9f9' }}>
                {item.product.image && <img src={item.product.image} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />}
                <div style={{ flex: 1 }}>
                  <div>{item.product.title}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{Object.values(item.sku.specs).join(' / ')}</div>
                </div>
                <div style={{ color: '#FF4400' }}>🪙{item.sku.price.toFixed(0)} × {item.quantity}</div>
              </div>
            ))}
          </div>
        ))}
      </Card>

      <Card title="支付方式" style={{ marginBottom: 16 }}>
        <Radio.Group value="huanbei" disabled>
          <Radio value="huanbei">🪙 换贝支付（手续费）</Radio>
        </Radio.Group>
        <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>交换手续费通过换贝账户扣除，换贝与人民币1:1</div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 4 }}>商品价值: <span style={{ fontWeight: 600 }}>🪙{itemTotal.toFixed(0)} 换贝</span></div>
            <div style={{ marginBottom: 4 }}>运费: <span style={{ fontWeight: 600 }}>{shippingFee === 0 ? <Tag color="green">免运费</Tag> : `🪙${shippingFee} 换贝`}</span></div>
            <div style={{ marginBottom: 4 }}>手续费(5%): <span style={{ fontWeight: 600, color: '#FF4400' }}>🪙{serviceFee} 换贝</span></div>
            <Divider style={{ margin: '8px 0' }} />
            <div>需扣除换贝: <span style={{ color: '#FF4400', fontSize: 24, fontWeight: 700 }}>🪙{serviceFee + shippingFee}</span></div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>商品交换价值: {totalAmount.toFixed(0)} 换贝</div>
          </div>
        </div>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" loading={loading} onClick={submitOrder}
          style={{ width: 200, height: 48, fontSize: 16 }}>确认交换</Button>
      </div>

      <Modal title="新增收货地址" open={showAddrModal} onCancel={() => setShowAddrModal(false)} onOk={() => form.submit()} okText="保存">
        <Form form={form} onFinish={addAddress} layout="vertical">
          <Form.Item name="name" label="收件人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="province" label="省" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="city" label="市" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="district" label="区" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="detail" label="详细地址" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
