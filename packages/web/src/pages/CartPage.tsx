import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Checkbox, InputNumber, Button, Empty, message, Divider } from 'antd';
import { DeleteOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../lib/api';
import { useCartStore } from '../stores/useCartStore';

interface CartItem {
  id: string; skuId: string; quantity: number; selected: boolean;
  sku: { id: string; specs: Record<string, string>; price: number; stock: number; image?: string };
  product: { id: string; title: string; image?: string };
}
interface ShopGroup { shop: { id: string; name: string }; items: CartItem[]; }

export default function CartPage() {
  const [groups, setGroups] = useState<ShopGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const setCount = useCartStore((s) => s.setCount);

  const fetchCart = () => {
    api.get('/cart').then(({ data }) => {
      setGroups(data);
      const total = data.reduce((s: number, g: ShopGroup) => s + g.items.length, 0);
      setCount(total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const allItems = groups.flatMap((g) => g.items);
  const selectedItems = allItems.filter((i) => i.selected);
  const totalPrice = selectedItems.reduce((s, i) => s + i.sku.price * i.quantity, 0);
  const serviceFee = Math.ceil(totalPrice * 0.05);
  const allSelected = allItems.length > 0 && allItems.every((i) => i.selected);

  const toggleSelectAll = async () => {
    await api.patch('/cart/select-all', { selected: !allSelected });
    fetchCart();
  };

  const updateItem = async (id: string, data: any) => {
    await api.put(`/cart/items/${id}`, data);
    fetchCart();
  };

  const deleteItem = async (id: string) => {
    await api.delete(`/cart/items/${id}`);
    fetchCart();
  };

  if (!loading && allItems.length === 0) {
    return <div style={{ maxWidth: 1200, margin: '60px auto', textAlign: 'center' }}>
      <Empty description="换物车是空的" />
      <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>去逛逛</Button>
    </div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
      <h2>🔄 换物车</h2>
      {groups.map((g) => (
        <div key={g.shop.id} style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}><ShopOutlined /> {g.shop.name}</div>
          {g.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Checkbox checked={item.selected} onChange={() => updateItem(item.id, { selected: !item.selected })} />
              <img src={item.product.image || item.sku.image || ''} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <Link to={`/product/${item.product.id}`} style={{ color: '#333' }}>{item.product.title}</Link>
                <div style={{ color: '#999', fontSize: 12 }}>{Object.values(item.sku.specs).join(' / ')}</div>
              </div>
              <span style={{ color: '#FF4400', fontWeight: 700, width: 100 }}>🪙{item.sku.price.toFixed(0)} 换贝</span>
              <InputNumber min={1} max={item.sku.stock} value={item.quantity}
                onChange={(v) => v && updateItem(item.id, { quantity: v })} size="small" />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteItem(item.id)} />
            </div>
          ))}
        </div>
      ))}

      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: '#fff', padding: 16, borderTop: '1px solid #f0f0f0' }}>
        <Checkbox checked={allSelected} onChange={toggleSelectAll}>全选</Checkbox>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>已选 {selectedItems.length} 件</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, color: '#FF4400', fontWeight: 700 }}>合计: 🪙{totalPrice.toFixed(0)} 换贝</div>
            <div style={{ fontSize: 12, color: '#999' }}>手续费(5%): 🪙{serviceFee} 换贝</div>
          </div>
          <Button type="primary" size="large" disabled={selectedItems.length === 0}
            onClick={() => navigate('/checkout')}>去交换</Button>
        </div>
      </div>
    </div>
  );
}
