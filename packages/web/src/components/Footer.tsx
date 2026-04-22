import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#f5f5f5', padding: '40px 24px', marginTop: 40, borderTop: '1px solid #e8e8e8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <h4 style={{ color: '#333' }}>关于换换</h4>
          <p style={{ color: '#999', fontSize: 13 }}>换换是一个以物换物的B2B交换平台，帮助企业高效处置库存、获取所需商品</p>
          <p style={{ color: '#999', fontSize: 13 }}>存量经济时代，让商品流通更高效</p>
        </div>
        <div>
          <h4 style={{ color: '#333' }}>帮助中心</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/help" style={{ color: '#666', fontSize: 13 }}>如何以物换物</Link>
            <Link to="/help/shipping" style={{ color: '#666', fontSize: 13 }}>物流配送说明</Link>
            <Link to="/help/huanbei" style={{ color: '#666', fontSize: 13 }}>换贝充值说明</Link>
            <Link to="/help/rules" style={{ color: '#666', fontSize: 13 }}>交换规则</Link>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#333' }}>商家服务</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/register" style={{ color: '#666', fontSize: 13 }}>商家入驻</Link>
            <Link to="/help/deposit" style={{ color: '#666', fontSize: 13 }}>押金说明</Link>
            <Link to="/help/fee" style={{ color: '#666', fontSize: 13 }}>手续费说明</Link>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#333' }}>联系方式</h4>
          <p style={{ color: '#666', fontSize: 13 }}>客服热线: 400-000-0000</p>
          <p style={{ color: '#666', fontSize: 13 }}>邮箱: support@huanhuan.com</p>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 12 }}>
        © 2026 换换 huanhuan.com All rights reserved. | 交换手续费: 双方各5%
      </div>
    </footer>
  );
}
