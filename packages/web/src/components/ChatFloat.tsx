import { useEffect, useState, useRef, useCallback } from 'react';
import { Input, Button, Avatar, Badge, Empty } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, UserOutlined, MinusOutlined } from '@ant-design/icons';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';

interface Conversation {
  id: string;
  lastMessageAt: string;
  unreadCountBuyer: number;
  unreadCountSeller: number;
  buyer: { id: string; nickname: string; avatar?: string };
  seller: { id: string; nickname: string; avatar?: string };
  shop: { id: string; name: string };
}

interface Message {
  id: string;
  senderId: string;
  type: string;
  content: string;
  createdAt: string;
  sender: { nickname: string; avatar?: string };
}

export default function ChatFloat() {
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingShopId = useChatStore((s) => s.pendingShopId);
  const clearPending = useChatStore((s) => s.clearPending);

  // Handle external open requests (e.g. from "联系商家" button)
  useEffect(() => {
    if (!pendingShopId || !user) return;
    const openConversation = async () => {
      try {
        const { data: conv } = await api.post('/chat/conversations', { shopId: pendingShopId });
        setExpanded(true);
        // Fetch full conversation list first so the sidebar is populated
        const { data: allConvs } = await api.get('/chat/conversations');
        setConversations(allConvs);
        const unread = allConvs.reduce((s: number, c: Conversation) => {
          return s + (c.buyer.id === user.id ? c.unreadCountBuyer : c.unreadCountSeller);
        }, 0);
        setTotalUnread(unread);
        // Find the matching conversation with full data (including buyer/seller)
        const match = allConvs.find((c: Conversation) => c.id === conv.id);
        setActiveConv(match || conv);
      } catch { /* ignore */ }
      clearPending();
    };
    openConversation();
  }, [pendingShopId, user, clearPending]);

  const fetchConversations = useCallback(() => {
    if (!user) return;
    api.get('/chat/conversations')
      .then(({ data }) => {
        setConversations(data);
        const unread = data.reduce((s: number, c: Conversation) => {
          return s + (c.buyer.id === user.id ? c.unreadCountBuyer : c.unreadCountSeller);
        }, 0);
        setTotalUnread(unread);
      })
      .catch(() => {});
  }, [user]);

  const fetchMessages = useCallback(() => {
    if (!activeConv) return;
    api.get(`/chat/conversations/${activeConv.id}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {});
  }, [activeConv]);

  useEffect(() => {
    if (user && expanded) {
      fetchConversations();
      pollRef.current = setInterval(() => {
        fetchConversations();
        if (activeConv) fetchMessages();
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, expanded, fetchConversations, fetchMessages, activeConv]);

  useEffect(() => {
    if (activeConv) fetchMessages();
  }, [activeConv, fetchMessages]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll unread count even when minimized
  useEffect(() => {
    if (user && !expanded) {
      fetchConversations();
      const id = setInterval(fetchConversations, 15000);
      return () => clearInterval(id);
    }
  }, [user, expanded, fetchConversations]);

  if (!user) return null;

  const getOtherUser = (conv: Conversation) =>
    conv.buyer.id === user.id ? conv.seller : conv.buyer;

  const sendMessage = async () => {
    if (!inputVal.trim() || !activeConv) return;
    try {
      await api.post(`/chat/conversations/${activeConv.id}/messages`, { content: inputVal.trim() });
      setInputVal('');
      fetchMessages();
    } catch { /* ignore */ }
  };

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed', right: 20, bottom: 80, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: '#FF4400', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,68,0,0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Badge count={totalUnread} size="small" offset={[4, -4]}>
          <MessageOutlined style={{ fontSize: 26, color: '#fff' }} />
        </Badge>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, zIndex: 1000,
      width: 380, height: 520,
      background: '#fff', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#FF4400', color: '#fff', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          <MessageOutlined style={{ marginRight: 6 }} />
          换换消息
          {totalUnread > 0 && <Badge count={totalUnread} size="small" style={{ marginLeft: 8 }} />}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <MinusOutlined style={{ cursor: 'pointer', fontSize: 16 }} onClick={() => setExpanded(false)} />
          <CloseOutlined style={{ cursor: 'pointer', fontSize: 16 }} onClick={() => { setExpanded(false); setActiveConv(null); }} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversation list */}
        <div style={{
          width: activeConv ? 72 : '100%',
          borderRight: activeConv ? '1px solid #f0f0f0' : 'none',
          overflowY: 'auto', transition: 'width 0.2s',
        }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 20 }}>
              <Empty description="暂无消息" imageStyle={{ height: 40 }} />
            </div>
          ) : conversations.map(conv => {
            const other = getOtherUser(conv);
            const unread = conv.buyer.id === user.id ? conv.unreadCountBuyer : conv.unreadCountSeller;
            const isActive = activeConv?.id === conv.id;

            if (activeConv) {
              return (
                <div key={conv.id} onClick={() => setActiveConv(conv)}
                  style={{
                    padding: 10, cursor: 'pointer', textAlign: 'center',
                    background: isActive ? '#FFF5F0' : '#fff',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                  title={`${other.nickname} - ${conv.shop.name}`}
                >
                  <Badge count={unread} size="small">
                    <Avatar size={40} icon={<UserOutlined />} src={other.avatar} />
                  </Badge>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {other.nickname.slice(0, 4)}
                  </div>
                </div>
              );
            }

            return (
              <div key={conv.id} onClick={() => setActiveConv(conv)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#fff', borderBottom: '1px solid #f5f5f5',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <Badge count={unread} size="small">
                  <Avatar size={40} icon={<UserOutlined />} src={other.avatar} />
                </Badge>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500 }}>{other.nickname}</div>
                  <div style={{ color: '#999', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.shop.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat area */}
        {activeConv && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '8px 12px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {getOtherUser(activeConv).nickname}
              </span>
              <Button type="text" size="small" onClick={() => setActiveConv(null)}
                style={{ fontSize: 12, color: '#999' }}>返回</Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', marginTop: 40 }}>暂无消息</div>}
              {messages.map(msg => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: 8,
                  }}>
                    {!isMe && <Avatar size={28} icon={<UserOutlined />} src={msg.sender.avatar} style={{ marginRight: 6, flexShrink: 0 }} />}
                    <div style={{
                      maxWidth: '70%', padding: '6px 10px', borderRadius: 8,
                      background: isMe ? '#FF4400' : '#f5f5f5',
                      color: isMe ? '#fff' : '#333', fontSize: 13, lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                    {isMe && <Avatar size={28} icon={<UserOutlined />} style={{ marginLeft: 6, flexShrink: 0 }} />}
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>

            <div style={{
              padding: '8px 10px', borderTop: '1px solid #f0f0f0',
              display: 'flex', gap: 6,
            }}>
              <Input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onPressEnter={sendMessage}
                placeholder="输入消息..."
                size="small"
                style={{ flex: 1 }}
              />
              <Button type="primary" size="small" icon={<SendOutlined />} onClick={sendMessage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
