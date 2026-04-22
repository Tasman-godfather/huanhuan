import { useEffect, useState } from 'react';
import { Modal, Checkbox, InputNumber, Empty, Spin, Tag, message, Input, Alert, Button } from 'antd';
import { SwapOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../lib/api';

interface SellerProduct {
  id: string;
  title: string;
  minPrice: number;
  status: string;
  images: { url: string }[];
  skus: { id: string; price: number; stock: number; specs: Record<string, string>; image?: string }[];
}

interface SelectedItem {
  productId: string;
  skuId: string;
  quantity: number;
  price: number;
  title: string;
  maxQty: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  targetProduct: {
    id: string;
    title: string;
    price: number;
    image?: string;
  };
  targetSkuId: string;
  targetQuantity: number;
}

export default function ExchangeModal({ open, onClose, targetProduct, targetSkuId, targetQuantity: initialQty }: Props) {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [remark, setRemark] = useState('');
  const [targetQty, setTargetQty] = useState(initialQty);

  useEffect(() => { setTargetQty(initialQty); }, [initialQty]);

  const targetValue = targetProduct.price * targetQty;

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelected(new Map());
      setRemark('');
      api.get('/seller/products')
        .then(({ data }) => {
          const active = (data.items || data).filter((p: SellerProduct) => p.status === 'active' && p.skus?.length > 0);
          setProducts(active);
        })
        .catch(() => message.error('获取库存失败'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const toggleProduct = (product: SellerProduct) => {
    const next = new Map(selected);
    const sku = product.skus[0];
    const key = sku.id;
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.set(key, {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        price: sku.price,
        title: product.title,
        maxQty: sku.stock,
      });
    }
    setSelected(next);
  };

  const updateQty = (skuId: string, qty: number) => {
    const next = new Map(selected);
    const item = next.get(skuId);
    if (item) {
      item.quantity = qty;
      next.set(skuId, { ...item });
    }
    setSelected(next);
  };

  const autoBalance = () => {
    if (products.length === 0) { message.warning('没有可用的库存商品'); return; }

    const next = new Map<string, SelectedItem>();
    let remaining = targetValue;

    // Build a list of (sku, product) entries sorted by price descending for greedy fill
    const candidates = products
      .map(p => ({ product: p, sku: p.skus[0] }))
      .filter(c => c.sku && c.sku.stock > 0)
      .sort((a, b) => b.sku.price - a.sku.price);

    for (const { product: p, sku } of candidates) {
      if (remaining <= 0) break;
      const maxAfford = Math.min(sku.stock, Math.ceil(remaining / sku.price));
      if (maxAfford <= 0) continue;

      // Pick the quantity that gets us closest to the target without massive overshoot
      let bestQty = 0;
      let bestDiff = Infinity;
      for (let q = 1; q <= maxAfford; q++) {
        const val = sku.price * q;
        const diff = Math.abs(remaining - val);
        if (diff < bestDiff || (diff === bestDiff && q < bestQty)) {
          bestDiff = diff;
          bestQty = q;
        }
        if (val >= remaining) break;
      }

      if (bestQty > 0) {
        next.set(sku.id, {
          productId: p.id,
          skuId: sku.id,
          quantity: bestQty,
          price: sku.price,
          title: p.title,
          maxQty: sku.stock,
        });
        remaining -= sku.price * bestQty;
      }
    }

    if (next.size === 0) {
      message.warning('无法自动配平，请手动选择');
    } else {
      setSelected(next);
      const total = Array.from(next.values()).reduce((s, i) => s + i.price * i.quantity, 0);
      if (Math.abs(total - targetValue) <= targetValue * 0.05) {
        message.success('已自动配平，价值基本匹配！');
      } else {
        message.info(`已智能选择最接近的组合 (¥${total.toFixed(0)} 换贝)`);
      }
    }
  };

  const offeredValue = Array.from(selected.values()).reduce((s, i) => s + i.price * i.quantity, 0);
  const diff = offeredValue - targetValue;
  const diffPercent = targetValue > 0 ? Math.abs(diff / targetValue * 100) : 0;

  const getValueStatus = () => {
    if (selected.size === 0) return { color: '#999', text: '请选择商品' };
    if (Math.abs(diff) <= targetValue * 0.1) return { color: '#52c41a', text: '价值匹配' };
    if (diff < 0) return { color: '#faad14', text: `不足 ${Math.abs(diff).toFixed(0)} 换贝` };
    return { color: '#1890ff', text: `超出 ${diff.toFixed(0)} 换贝` };
  };
  const valueStatus = getValueStatus();

  const handleSubmit = async () => {
    if (selected.size === 0) { message.warning('请至少选择一件商品'); return; }
    setSubmitting(true);
    try {
      const offeredItems = Array.from(selected.values()).map(i => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
      }));
      await api.post('/exchanges', {
        targetProductId: targetProduct.id,
        targetSkuId,
        targetQuantity: targetQty,
        offeredItems,
        remark: remark || undefined,
      });
      message.success('交换申请已发送，等待对方回复！');
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<><SwapOutlined /> 用我的商品交换</>}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="发起交换"
      cancelText="取消"
      confirmLoading={submitting}
      width={720}
      styles={{ body: { maxHeight: 520, overflowY: 'auto' } }}
    >
      <div style={{ background: '#FFF5F0', padding: 12, borderRadius: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        {targetProduct.image && <img src={targetProduct.image} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>目标商品: {targetProduct.title}</div>
          <div style={{ color: '#999', fontSize: 12 }}>单价: ¥{targetProduct.price.toFixed(0)} 换贝</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>交换数量</div>
          <InputNumber min={1} max={99} value={targetQty} onChange={v => v && setTargetQty(v)} size="small" style={{ width: 70 }} />
          <div style={{ color: '#FF4400', fontSize: 16, fontWeight: 700, marginTop: 4 }}>¥{targetValue.toFixed(0)} 换贝</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
        <span>我的出价: <span style={{ color: '#FF4400', fontWeight: 700, fontSize: 18 }}>¥{offeredValue.toFixed(0)}</span> 换贝</span>
        <Tag color={valueStatus.color} style={{ fontSize: 13, padding: '2px 10px' }}>{valueStatus.text}</Tag>
      </div>

      {diffPercent > 30 && selected.size > 0 && (
        <Alert
          message="价值差异较大，对方可能会还价"
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>选择我的库存商品:</span>
        <Button
          type="primary"
          ghost
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={autoBalance}
          disabled={loading || products.length === 0}
        >
          智能配平
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : products.length === 0 ? (
        <Empty description="暂无可交换的商品，请先发布商品" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map(p => {
            const sku = p.skus[0];
            const isSelected = selected.has(sku.id);
            const item = selected.get(sku.id);
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  border: `2px solid ${isSelected ? '#FF4400' : '#f0f0f0'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                  background: isSelected ? '#FFF5F0' : '#fff',
                }}
                onClick={() => toggleProduct(p)}
              >
                <Checkbox checked={isSelected} />
                <img
                  src={p.images?.[0]?.url || ''}
                  alt=""
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{p.title}</div>
                  <div style={{ color: '#FF4400', fontWeight: 600 }}>¥{sku.price.toFixed(0)} 换贝</div>
                  <div style={{ color: '#999', fontSize: 12 }}>库存: {sku.stock}</div>
                </div>
                {isSelected && (
                  <div onClick={e => e.stopPropagation()}>
                    <InputNumber
                      min={1}
                      max={item?.maxQty || sku.stock}
                      value={item?.quantity || 1}
                      onChange={v => v && updateQty(sku.id, v)}
                      size="small"
                      style={{ width: 70 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 4, color: '#666', fontSize: 13 }}>备注 (可选):</div>
        <Input.TextArea
          value={remark}
          onChange={e => setRemark(e.target.value)}
          placeholder="给对方留言，例如交换意向说明..."
          rows={2}
          maxLength={200}
        />
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', background: '#f9f9f9', borderRadius: 6, fontSize: 12, color: '#999' }}>
        交换完成后，平台将从双方各扣除商品价值5%的换贝作为手续费。
        您需支付: <span style={{ color: '#FF4400', fontWeight: 600 }}>{Math.ceil(offeredValue * 0.05)}</span> 换贝手续费
      </div>
    </Modal>
  );
}
