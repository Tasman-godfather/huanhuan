import { useState } from 'react';
import { Form, Input, Button, Tabs, message, Card } from 'antd';
import { MailOutlined, LockOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onEmailLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.user, data.token);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally { setLoading(false); }
  };

  const onPhoneLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.user, data.token);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
      <Card>
        <h2 style={{ textAlign: 'center', color: '#FF4400', marginBottom: 24 }}>登录换换</h2>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: 24, fontSize: 13 }}>以物换物 · 存量时代的交换平台</p>
        <Tabs defaultActiveKey="email" centered items={[
          { key: 'email', label: '邮箱登录', children: (
            <Form onFinish={onEmailLogin} size="large">
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                <Input prefix={<MailOutlined />} placeholder="商家邮箱" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
              </Form.Item>
            </Form>
          )},
          { key: 'phone', label: '手机登录', children: (
            <Form onFinish={onPhoneLogin} size="large">
              <Form.Item name="phone" rules={[{ required: true, pattern: /^\d{11}$/, message: '请输入11位手机号' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="手机号" />
              </Form.Item>
              <Form.Item name="code" rules={[{ required: true, len: 6, message: '请输入6位验证码' }]}>
                <Input prefix={<SafetyOutlined />} placeholder="验证码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
              </Form.Item>
            </Form>
          )},
        ]} />
        <div style={{ textAlign: 'center' }}>
          还没有账号？<Link to="/register">商家入驻</Link>
        </div>
      </Card>
    </div>
  );
}
