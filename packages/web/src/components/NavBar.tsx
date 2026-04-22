import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, Space, AutoComplete } from 'antd';
import { SwapOutlined, UserOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useState, useEffect } from 'react';
import api from '../lib/api';

const hotSearches = ['茶叶', '白酒', '大米', '橄榄油', '服装', '电子产品'];

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.count);
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState<{ value: string }[]>([]);

  const handleSearch = (val?: string) => {
    const q = (val || searchVal).trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (searchVal.trim().length < 1) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      api.get('/search/suggestions', { params: { q: searchVal } })
        .then(({ data }) => setSuggestions(data.map((s: string) => ({ value: s }))))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [searchVal]);

  const userMenu = {
    items: [
      { key: 'profile', label: <Link to="/user/profile">商家中心</Link> },
      { key: 'orders', label: <Link to="/user/orders">我的交换</Link> },
      { key: 'favorites', label: <Link to="/user/favorites">收藏夹</Link> },
      { key: 'huanbei', label: <Link to="/user/huanbei">换贝账户</Link> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', onClick: () => { logout(); navigate('/'); } },
    ],
  };

  return (
    <div style={{ background: '#FF4400', padding: '12px 40px 0' }}>
      <div style={{ maxWidth: 1920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40 }}>

          <Link to="/" style={{ color: '#fff', textDecoration: 'none', flexShrink: 0, paddingTop: 4 }}>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>换换</div>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1 }}>huanhuan.com</div>
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', height: 40 }}>
              <div style={{ background: '#fff', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', padding: '0 14px', borderRight: '1px solid #e8e8e8', fontSize: 13, color: '#333', fontWeight: 500, flexShrink: 0 }}>
                换品
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <AutoComplete
                  value={searchVal}
                  options={suggestions}
                  onSelect={(val) => { setSearchVal(val); handleSearch(val); }}
                  onChange={setSearchVal}
                  style={{ width: '100%' }}
                  popupMatchSelectWidth={true}
                >
                  <input
                    placeholder="搜索想要换取的商品"
                    style={{ width: '100%', height: 40, border: 'none', outline: 'none', padding: '0 14px', fontSize: 14, boxSizing: 'border-box' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </AutoComplete>
              </div>
              <button onClick={() => handleSearch()}
                style={{ background: '#FF6600', color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', padding: '0 30px', fontSize: 16, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                搜索
              </button>
              <button onClick={() => navigate('/search?q=推荐')}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 4, padding: '0 14px', marginLeft: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, flexShrink: 0 }}>
                <CameraOutlined /> 找同款
              </button>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingBottom: 10 }}>
              {hotSearches.map((w) => (
                <span key={w} onClick={() => { setSearchVal(w); handleSearch(w); }}
                  style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, paddingTop: 6 }}>
            <Link to="/search?q=热门" style={{ color: '#fff', fontSize: 12, textAlign: 'right', textDecoration: 'none', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>以物换物 高效交换</div>
              <div style={{ opacity: 0.7 }}>存量经济新模式 &gt;</div>
            </Link>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.3)' }} />
            {user ? (
              <Dropdown menu={userMenu}>
                <span style={{ color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  <UserOutlined /> {user.nickname}
                </span>
              </Dropdown>
            ) : (
              <Space size={4}>
                <Button type="link" size="small" style={{ color: '#fff', fontSize: 13, padding: 0 }} onClick={() => navigate('/login')}>登录</Button>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
                <Button type="link" size="small" style={{ color: '#fff', fontSize: 13, padding: 0 }} onClick={() => navigate('/register')}>入驻</Button>
              </Space>
            )}
            <Badge count={cartCount} size="small" offset={[-2, 2]}>
              <Link to="/cart" style={{ color: '#fff', fontSize: 20 }}>
                <SwapOutlined />
              </Link>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
