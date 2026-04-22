import { useEffect, useState, useRef } from 'react';
import { Input, Button, List, Avatar, Badge, Empty, Spin } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

interface Conversation {
  id: string; lastMessageAt: string; unreadCountBuyer: number; unreadCountSeller: number;
  buyer: { id: string; nickname: string; avatar?: string };
  seller: { id: string; nickname: string; avatar?: string };
  shop: { id: string; name: string };
}
interface Message { id: string; senderId: string; type: string; content: string; createdAt: string; sender: { nickname: string; avatar?: string } }

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chat/conversations').then(({ data }) => { setConversations(data); if (data.length > 0) setActiveConv(data[0]); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeConv) {
      api.get(`/chat/conversations/${activeConv.id}/messages`).then(({ data }) => setMessages(data));
    }
  }, [activeConv]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!inputVal.trim() || !activeConv) return;
    await api.post(`/chat/conversations/${activeConv.id}/messages`, { content: inputVal.trim() });
    setInputVal('');
    const { data } = await api.get(`/chat/conversations/${activeConv.id}/messages`);
    setMessages(data);
  };

  const getOtherUser = (conv: Conversation) => conv.buyer.id === user?.id ? conv.seller : conv.buyer;
  const getUnread = (conv: Conversation) => conv.buyer.id === user?.id ? conv.unreadCountBuyer : conv.unreadCountSeller;

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', display: 'flex', gap: 0, height: 'calc(100vh - 200px)', minHeight: 500 }}>
      {/* Conversation list */}
      <div style={{ width: 280, borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>消息列表</div>
        {conversations.length === 0 ? <Empty description="暂无消息" style={{ marginTop: 40 }} /> :
          conversations.map((conv) => {
            const other = getOtherUser(conv);
            const unread = getUnread(conv);
            return (
              <div key={conv.id} onClick={() => setActiveConv(conv)}
                style={{ padding: '12px 16px', cursor: 'pointer', background: activeConv?.id === conv.id ? '#FFF5F0' : '#fff', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge count={unread} size="small">
                  <Avatar icon={<UserOutlined />} src={other.avatar} />
                </Badge>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500 }}>{other.nickname}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{conv.shop.name}</div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>选择一个会话开始聊天</div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>
              {getOtherUser(activeConv).nickname} - {activeConv.shop.name}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    {!isMe && <Avatar size="small" icon={<UserOutlined />} src={msg.sender.avatar} style={{ marginRight: 8 }} />}
                    <div style={{
                      maxWidth: '60%', padding: '8px 12px', borderRadius: 8,
                      background: isMe ? '#FF4400' : '#f5f5f5', color: isMe ? '#fff' : '#333',
                    }}>
                      {msg.content}
                    </div>
                    {isMe && <Avatar size="small" icon={<UserOutlined />} style={{ marginLeft: 8 }} />}
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
              <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                onPressEnter={sendMessage} placeholder="输入消息..." size="large" />
              <Button type="primary" icon={<SendOutlined />} size="large" onClick={sendMessage}>发送</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
