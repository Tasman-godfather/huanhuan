import { useState } from 'react';
import { Form, Input, Button, Tabs, message, Card, Alert } from 'antd';
import { MailOutlined, LockOutlined, PhoneOutlined, SafetyOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onEmailRegister = async (values: { email: string; password: string; nickname: string; companyName: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', values);
      setAuth(data.user, data.token);
      message.success('入驻成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '入驻失败');
    } finally { setLoading(false); }
  };

  const onPhoneRegister = async (values: { phone: string; code: string; nickname: string; companyName: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', values);
      setAuth(data.user, data.token);
      message.success('入驻成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '入驻失败');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <Card>
        <h2 style={{ textAlign: 'center', color: '#FF4400', marginBottom: 16 }}>商家入驻换换</h2>
        <Alert
          message="入驻须知"
          description={
            <div style={{ fontSize: 13 }}>
              <p>• 入驻需缴纳最低 <b>10,000元押金</b>，兑换为 <b>10,000换贝</b></p>
              <p>• 换贝与人民币 <b>1:1</b> 结算，用于商品标价</p>
              <p>• 每次交换双方各收取 <b>5%</b> 手续费</p>
              <p>• 单次交换价值超过200,000换贝需提前充值</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Tabs defaultActiveKey="email" centered items={[
          { key: 'email', label: '邮箱入驻', children: (
            <Form onFinish={onEmailRegister} size="large">
              <Form.Item name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                <Input prefix={<ShopOutlined />} placeholder="企业/品牌名称" />
              </Form.Item>
              <Form.Item name="nickname" rules={[{ required: true, message: '请输入联系人名称' }]}>
                <Input prefix={<UserOutlined />} placeholder="联系人名称" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                <Input prefix={<MailOutlined />} placeholder="企业邮箱" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>立即入驻</Button>
              </Form.Item>
            </Form>
          )},
          { key: 'phone', label: '手机入驻', children: (
            <Form onFinish={onPhoneRegister} size="large">
              <Form.Item name="companyName" rules={[{ required: true, message: '请输入企业名称' }]}>
                <Input prefix={<ShopOutlined />} placeholder="企业/品牌名称" />
              </Form.Item>
              <Form.Item name="nickname" rules={[{ required: true, message: '请输入联系人名称' }]}>
                <Input prefix={<UserOutlined />} placeholder="联系人名称" />
              </Form.Item>
              <Form.Item name="phone" rules={[{ required: true, pattern: /^\d{11}$/, message: '请输入11位手机号' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="手机号" />
              </Form.Item>
              <Form.Item name="code" rules={[{ required: true, len: 6, message: '请输入6位验证码' }]}>
                <Input prefix={<SafetyOutlined />} placeholder="验证码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>立即入驻</Button>
              </Form.Item>
            </Form>
          )},
        ]} />
        <div style={{ textAlign: 'center' }}>
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  );
}
