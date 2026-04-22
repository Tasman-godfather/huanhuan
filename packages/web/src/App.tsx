import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import NavBar from './components/NavBar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchPage from './pages/SearchPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import UserCenterPage from './pages/UserCenterPage';
import SellerCenterPage from './pages/SellerCenterPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatFloat from './components/ChatFloat';

const theme = {
  token: {
    colorPrimary: '#FF4400',
    colorLink: '#FF4400',
    borderRadius: 4,
  },
};

const Placeholder = ({ name }: { name: string }) => (
  <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', minHeight: 400 }}>
    <h2>{name}</h2>
    <p style={{ color: '#999' }}>页面开发中...</p>
  </div>
);

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <TopBar />
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/user/*" element={<UserCenterPage />} />
        <Route path="/seller/*" element={<SellerCenterPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Placeholder name="404 - 页面不存在" />} />
      </Routes>
      <Footer />
      <ChatFloat />
    </ConfigProvider>
  );
}

export default App;

// force hmr
