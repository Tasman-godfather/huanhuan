import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Select, Slider, Pagination, Spin, Empty, Tag, Radio } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import api from '../lib/api';

interface ProductItem {
  id: string; title: string; minPrice: number; salesCount: number; rating: number;
  images: { url: string }[]; shop: { name: string };
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const categoryId = params.get('categoryId') || '';
  const urlSortBy = params.get('sortBy') || '';
  const urlOrder = params.get('order') || 'desc';
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(urlSortBy);
  const [order, setOrder] = useState(urlOrder);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [catName, setCatName] = useState('');

  useEffect(() => { setSortBy(urlSortBy); setOrder(urlOrder); setPage(1); }, [urlSortBy, urlOrder]);
  useEffect(() => {
    if (categoryId) {
      api.get('/categories').then(({ data }) => {
        const cat = data.find((c: any) => c.id === categoryId);
        setCatName(cat?.name || '');
      }).catch(() => {});
    } else { setCatName(''); }
  }, [categoryId]);

  useEffect(() => {
    setLoading(true);
    const queryParams: any = { page, pageSize: 20, sortBy, order };
    if (q) queryParams.q = q;
    if (categoryId) queryParams.categoryId = categoryId;
    if (priceRange[0] > 0) queryParams.minPrice = priceRange[0];
    if (priceRange[1] < 10000) queryParams.maxPrice = priceRange[1];
    api.get('/products', { params: queryParams })
      .then(({ data }) => { setProducts(data.items); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [q, categoryId, page, sortBy, order, priceRange]);

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>{catName ? `${catName}${q ? ' > ' + q : ''} ` : q ? `搜索 "${q}" ` : sortBy === 'sales' ? '热门交换 ' : sortBy === 'rating' ? '品质甄选 ' : sortBy === 'createdAt' ? '新品上架 ' : '全部商品 '}共 {total} 个可换商品</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color={!sortBy ? '#FF4400' : 'default'} style={{ cursor: 'pointer' }} onClick={() => setSortBy('')}>综合</Tag>
          <Tag color={sortBy === 'sales' ? '#FF4400' : 'default'} style={{ cursor: 'pointer' }} onClick={() => setSortBy('sales')}>交换量</Tag>
          <Tag color={sortBy === 'price' ? '#FF4400' : 'default'} style={{ cursor: 'pointer' }}
            onClick={() => { setSortBy('price'); setOrder(order === 'asc' ? 'desc' : 'asc'); }}>
            换贝价 {sortBy === 'price' ? (order === 'asc' ? '↑' : '↓') : ''}
          </Tag>
          <Tag color={sortBy === 'rating' ? '#FF4400' : 'default'} style={{ cursor: 'pointer' }} onClick={() => setSortBy('rating')}>评分</Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#999' }}>换贝价:</span>
          <Slider range min={0} max={10000} value={priceRange} onChange={(v) => setPriceRange(v as [number, number])} style={{ width: 150 }} />
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} size="small">
            <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
          </Radio.Group>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> :
        products.length === 0 ? <Empty description="没有找到可交换的商品" /> : (
        <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, flexDirection: 'column' }}>
          {products.map((p) => (
            <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
              <Card hoverable cover={p.images[0] && <img alt="" src={p.images[0].url} style={{ height: viewMode === 'grid' ? 220 : 120, objectFit: 'cover' }} />}
                bodyStyle={{ padding: 12 }}>
                <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ color: '#FF4400', fontWeight: 700, fontSize: 18, marginTop: 4 }}>🪙{p.minPrice.toFixed(0)} 换贝</div>
                <div style={{ color: '#999', fontSize: 12 }}>{p.shop.name} | {p.salesCount}次交换</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination current={page} total={total} pageSize={20} onChange={setPage} showSizeChanger={false} />
      </div>
    </div>
  );
}
