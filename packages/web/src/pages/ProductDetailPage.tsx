import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Carousel, Tag, Rate, Button, InputNumber, message, Spin, Divider, Modal, Form, Input, Select, Upload } from 'antd';
import { SwapOutlined, ShopOutlined, HeartOutlined, HeartFilled, MessageOutlined, ShoppingCartOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import api from '../lib/api';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';
import ExchangeModal from '../components/ExchangeModal';

interface Sku { id: string; specs: Record<string, string>; price: number; originalPrice: number; stock: number; image?: string; }
interface Product {
  id: string; title: string; description: string; videoUrl?: string; minPrice: number; maxPrice: number;
  salesCount: number; rating: number; reviewCount: number; wantItems?: string; categoryId?: string;
  skus: Sku[]; images: { id: string; url: string; type: string }[];
  shop: { id: string; name: string; logo?: string; rating: number; followerCount: number; sellerId?: string };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [qty, setQty] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm] = Form.useForm();
  const increment = useCartStore((s) => s.increment);
  const user = useAuthStore((s) => s.user);
  const openChat = useChatStore((s) => s.openChat);

  const isOwner = user && product?.shop?.sellerId === user.id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const fetchProduct = () => {
    api.get(`/products/${id}`).then(({ data }) => {
      setProduct(data);
      if (data.skus.length === 1) setSelectedSku(data.skus[0]);
    }).catch(() => message.error('商品不存在')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const openEditModal = () => {
    if (!product) return;
    editForm.setFieldsValue({
      title: product.title,
      description: product.description?.replace(/<[^>]*>/g, '') || '',
      categoryId: product.categoryId,
      wantItems: product.wantItems || '',
      price: product.skus[0]?.price,
      originalPrice: product.skus[0]?.originalPrice,
      stock: product.skus[0]?.stock,
    });
    const imgUrl = (url: string) => url;
    setEditFileList(product.images.map((img, i) => ({
      uid: img.id || `-${i}`, name: `image-${i}`, status: 'done' as const,
      url: imgUrl(img.url), response: { url: img.url },
    })));
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
    setShowEdit(true);
  };

  const handleEditUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('images', file);
    try {
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess({ url: data[0].url }, file);
    } catch (err) { onError(err); message.error('上传失败'); }
  };

  const handleEditSave = async (values: any) => {
    if (!product) return;
    setEditSaving(true);
    try {
      const images = editFileList.filter(f => f.status === 'done').map((f, i) => ({
        url: f.response?.url || f.url, type: i === 0 ? 'main' : 'detail',
      }));
      const endpoint = isAdmin ? `/admin/products/${product.id}` : `/products/${product.id}`;
      await api.put(endpoint, {
        title: values.title,
        description: `<p>${values.description}</p>`,
        categoryId: values.categoryId,
        wantItems: values.wantItems,
        images,
        skus: [{ specs: product.skus[0]?.specs || { '默认': '默认' }, price: Number(values.price), originalPrice: Number(values.originalPrice || values.price), stock: Number(values.stock) }],
      });
      message.success('商品已更新');
      setShowEdit(false);
      setLoading(true);
      fetchProduct();
    } catch { message.error('保存失败'); }
    finally { setEditSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!product) return <div style={{ textAlign: 'center', padding: 100 }}>商品不存在</div>;

  const price = selectedSku ? selectedSku.price : product.minPrice;
  const originalPrice = selectedSku ? selectedSku.originalPrice : product.maxPrice;
  const stock = selectedSku ? selectedSku.stock : product.skus.reduce((s, k) => s + k.stock, 0);
  const serviceFee = Math.ceil(price * qty * 0.05);

  const addToCart = async () => {
    if (!selectedSku) { message.warning('请选择规格'); return; }
    try {
      await api.post('/cart/items', { skuId: selectedSku.id, quantity: qty });
      increment();
      message.success('已加入换物车');
    } catch (err: any) { message.error(err.response?.data?.message || '添加失败'); }
  };

  const specKeys = product.skus.length > 0 ? Object.keys(product.skus[0].specs) : [];

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ width: 480 }}>
          <Carousel autoplay>
            {product.images.map((img) => (
              <div key={img.id}><img src={img.url} alt="" style={{ width: '100%', height: 480, objectFit: 'cover' }} /></div>
            ))}
          </Carousel>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, margin: 0, flex: 1 }}>{product.title}</h1>
            {canEdit && <Button type="primary" ghost icon={<EditOutlined />} onClick={openEditModal}>{isAdmin ? '管理员编辑' : '编辑商品'}</Button>}
          </div>
          <div style={{ background: '#FFF5F0', padding: 16, borderRadius: 4, marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#FF4400', fontSize: 28, fontWeight: 700 }}>🪙 {price.toFixed(0)} 换贝</span>
              {originalPrice > price && (
                <span style={{ color: '#999', textDecoration: 'line-through', marginLeft: 12, fontSize: 14 }}>{originalPrice.toFixed(0)} 换贝</span>
              )}
              {originalPrice > price && <Tag color="red" style={{ marginLeft: 8 }}>{Math.round((1 - price / originalPrice) * 100)}% 优惠</Tag>}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              交换手续费: 双方各 <span style={{ color: '#FF4400', fontWeight: 600 }}>5%</span>（约 {serviceFee} 换贝）
            </div>
          </div>

          {product.wantItems && (
            <div style={{ background: '#E8F5E9', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              <span style={{ fontWeight: 600, color: '#2E7D32' }}>🔄 想换取: </span>
              <span style={{ color: '#333' }}>{product.wantItems}</span>
            </div>
          )}

          <div style={{ color: '#999', marginBottom: 16 }}>交换次数 {product.salesCount} | <Rate disabled value={product.rating} style={{ fontSize: 14 }} /> {product.reviewCount}条评价</div>

          {specKeys.map((key) => {
            const values = [...new Set(product.skus.map((s) => s.specs[key]))];
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <span style={{ color: '#666', marginRight: 8 }}>{key}:</span>
                {values.map((v) => (
                  <Tag key={v} color={selectedSku?.specs[key] === v ? '#FF4400' : 'default'}
                    style={{ cursor: 'pointer', marginBottom: 4 }}
                    onClick={() => {
                      const match = product.skus.find((s) => s.specs[key] === v);
                      if (match) setSelectedSku(match);
                    }}>{v}</Tag>
                ))}
              </div>
            );
          })}

          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#666', marginRight: 8 }}>数量:</span>
            <InputNumber min={1} max={stock} value={qty} onChange={(v) => setQty(v || 1)} />
            <span style={{ color: '#999', marginLeft: 8 }}>库存 {stock} 件</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="primary" size="large" icon={<SwapOutlined />}
              style={{ flex: 1, height: 48 }}
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                if (!selectedSku) { message.warning('请选择规格'); return; }
                setShowExchange(true);
              }}>用我的商品交换</Button>
            <Button size="large" icon={<ShoppingCartOutlined />}
              style={{ borderColor: '#FF4400', color: '#FF4400', height: 48 }}
              onClick={addToCart}>加入换物车</Button>
            <Button size="large"
              style={{ height: 48 }}
              onClick={() => { addToCart().then(() => navigate('/cart')); }}>直接换贝购买</Button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button icon={isFav ? <HeartFilled style={{ color: '#FF4400' }} /> : <HeartOutlined />}
              onClick={async () => {
                if (!user) { navigate('/login'); return; }
                try {
                  if (isFav) { message.info('已在收藏夹'); }
                  else { await api.post('/user/favorites', { type: 'product', targetId: id }); setIsFav(true); message.success('已收藏'); }
                } catch { message.error('操作失败'); }
              }}>{isFav ? '已收藏' : '收藏'}</Button>
            <Button icon={<MessageOutlined />} onClick={() => {
              if (!user) { navigate('/login'); return; }
              openChat(product.shop.id);
            }}>联系商家</Button>
          </div>

          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShopOutlined style={{ fontSize: 24, color: '#FF4400' }} />
            <div>
              <div style={{ fontWeight: 600 }}>{product.shop.name}</div>
              <div style={{ color: '#999', fontSize: 12 }}>评分 {product.shop.rating} | 关注 {product.shop.followerCount}</div>
            </div>
          </div>
        </div>
      </div>

      <Divider>商品详情</Divider>
      <div dangerouslySetInnerHTML={{ __html: product.description }} style={{ lineHeight: 1.8 }} />

      {product && selectedSku && (
        <ExchangeModal
          open={showExchange}
          onClose={() => setShowExchange(false)}
          targetProduct={{
            id: product.id,
            title: product.title,
            price: selectedSku.price,
            image: product.images[0]?.url,
          }}
          targetSkuId={selectedSku.id}
          targetQuantity={qty}
        />
      )}

      <Modal title="编辑商品" open={showEdit} onCancel={() => setShowEdit(false)} onOk={() => editForm.submit()} okText="保存" confirmLoading={editSaving} width={650}>
        {isAdmin && <div style={{ marginBottom: 12, padding: '6px 12px', background: '#FFF7E6', borderRadius: 4, fontSize: 12, color: '#D48806' }}>👑 管理员模式 - 可编辑任意商家的商品</div>}
        <Form form={editForm} onFinish={handleEditSave} layout="vertical">
          <Form.Item name="title" label="商品标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="商品描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select>{categories.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}</Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="price" label="换贝价" rules={[{ required: true }]} style={{ flex: 1 }}><Input type="number" /></Form.Item>
            <Form.Item name="originalPrice" label="市场参考价" style={{ flex: 1 }}><Input type="number" /></Form.Item>
            <Form.Item name="stock" label="库存" style={{ flex: 1 }}><Input type="number" /></Form.Item>
          </div>
          <Form.Item name="wantItems" label="想换取的商品"><Input /></Form.Item>
          <Form.Item label="商品图片">
            <Upload customRequest={handleEditUpload} listType="picture-card" fileList={editFileList}
              onChange={({ fileList: fl }) => setEditFileList(fl)} accept="image/*" multiple>
              {editFileList.length >= 8 ? null : <div><PlusOutlined /><div style={{ marginTop: 8, fontSize: 12 }}>上传</div></div>}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
