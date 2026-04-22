import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  return (
    <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', fontSize: 12, color: '#666', padding: '0 40px' }}>
      <div style={{ maxWidth: 1920, margin: '0 auto', display: 'flex', justifyContent: 'space-between', height: 28, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>换换 · 以物换物</span>
          <span style={{ color: '#ccc' }}>|</span>
          {user ? (
            <span>Hi，<Link to="/user/profile" style={{ color: '#FF4400' }}>{user.nickname}</Link></span>
          ) : (
            <>
              <Link to="/login" style={{ color: '#FF4400' }}>请登录</Link>
              <Link to="/register" style={{ color: '#FF4400' }}>商家入驻</Link>
            </>
          )}
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/seller/dashboard" style={{ color: '#666' }}>商家中心</Link>
          {user?.role === 'admin' && <><span style={{ color: '#ccc' }}>|</span><Link to="/admin/dashboard" style={{ color: '#FF4400', fontWeight: 600 }}>👑 管理后台</Link></>}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/user/orders" style={{ color: '#666' }}>我的交换</Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/cart" style={{ color: '#666' }}>🔄 换物车</Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/user/favorites" style={{ color: '#666' }}>❤️ 收藏夹</Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/seller/products" style={{ color: '#666' }}>发布商品</Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/chat" style={{ color: '#666' }}>联系对方</Link>
        </div>
      </div>
    </div>
  );
}
