import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Carousel, Spin, Tag } from "antd";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";
interface P { id: string; title: string; minPrice: number; salesCount: number; images: { url: string }[]; shop: { name: string }; }
interface Cat { id: string; name: string; icon?: string; }
const catMeta: Record<string, { icon: string; subs: string[] }> = {
  "茶叶":   { icon: "🍵", subs: ["绿茶", "红茶", "普洱"] },
  "白酒":   { icon: "🍶", subs: ["酱香", "浓香", "清香"] },
  "食品":   { icon: "🍜", subs: ["零食", "饮品", "调味"] },
  "服装纺织": { icon: "👗", subs: ["面料", "成衣", "配饰"] },
  "电子数码": { icon: "📱", subs: ["手机", "电脑", "配件"] },
  "美妆日化": { icon: "💄", subs: ["护肤", "彩妆", "日用"] },
  "家居建材": { icon: "🪑", subs: ["家具", "灯具", "五金"] },
  "农产品":  { icon: "🌾", subs: ["水果", "粮油", "生鲜"] },
  "工业品":  { icon: "⚙️", subs: ["机械", "原料", "工具"] },
};
const banners = [
  { id: 1, bg: "linear-gradient(135deg,#FF6B35,#FF4400)", t1: "以物换物 存量时代新模式", t2: "库存变资源 交换创价值", sub: "商家入驻即送10000换贝", tag: "新模式" },
  { id: 2, bg: "linear-gradient(135deg,#2B5EA7,#1A3F7A)", t1: "省去中间环节", t2: "直接交换 降低成本", sub: "双方各仅收取5%手续费", tag: "低成本" },
  { id: 3, bg: "linear-gradient(135deg,#8B6914,#A0782C)", t1: "茶换酒 布换粮", t2: "万物皆可换", sub: "已有10000+商家入驻", tag: "热门" },
];
const tabs = [
  { n: "推荐交换", i: "🔄", hot: true }, { n: "茶叶酒水", i: "🍵" }, { n: "服装纺织", i: "👗" },
  { n: "电子数码", i: "📱" }, { n: "食品农产", i: "🌾" }, { n: "家居建材", i: "🏠" },
  { n: "工业原料", i: "⚙️" }, { n: "美妆日化", i: "💄" },
];
export default function HomePage() {
  const [ps, setPs] = useState<P[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [ld, setLd] = useState(true);
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    api.get("/products/recommendations").then(({ data }) => setPs(data)).catch(() => {}).finally(() => setLd(false));
    api.get("/categories").then(({ data }) => setCats(data)).catch(() => {});
  }, []);
  const promos = [
    { title: "热门交换", tag: "换", tc: "red", link: "/search?sortBy=sales", s: [4, 7] as const },
    { title: "品质甄选", tag: "", tc: "", link: "/search?sortBy=rating", s: [7, 10] as const },
    { title: "🔥 新品上架", tag: "新", tc: "green", link: "/search?sortBy=createdAt", s: [10, 13] as const },
    { title: "⚡ 限时换购", tag: "限时", tc: "orange", link: "/search?sortBy=sales&order=desc", s: [13, 16] as const },
  ];
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1920, margin: "0 auto", display: "flex", gap: 24, padding: "8px 40px", fontSize: 13 }}>
          <Link to="/search?sortBy=sales" style={{ color: "#FF4400", fontWeight: 600 }}>🔥 热门交换</Link>
          <Link to="/search?q=茶叶" style={{ color: "#333" }}>🍵 茶叶交换</Link>
          <Link to="/search?q=白酒" style={{ color: "#333" }}>🍶 酒水交换</Link>
          <Link to="/search?q=服装" style={{ color: "#333" }}>👗 服装纺织</Link>
          <Link to="/search?q=电子" style={{ color: "#333" }}>📱 电子数码</Link>
          <Link to="/search?q=食品" style={{ color: "#333" }}>🌾 食品农产</Link>
          <Link to="/register" style={{ color: "#FF4400" }}>🏪 商家入驻</Link>
        </div>
      </div>
      <div style={{ maxWidth: 1920, margin: "0 auto", padding: "10px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 200px", gridTemplateRows: "200px auto", gap: 10, marginBottom: 12 }}>
          <div style={{ gridRow: "1 / 3", gridColumn: "1", background: "#fff", borderRadius: 8, padding: "4px 0" }}>
            <Link to="/help/huanbei" style={{ display: "block", padding: "6px 12px", color: "#FF4400", textDecoration: "none", fontSize: 12, fontWeight: 600, borderBottom: "1px solid #f5f5f5" }}>🪙 换贝说明 / 充值入口</Link>
            {cats.map((c) => {
              const meta = catMeta[c.name] || { icon: "📦", subs: [] };
              const catLink = "/search?categoryId=" + c.id;
              return (
                <div key={c.id} style={{ padding: "5px 12px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "baseline", gap: 2, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                  <span style={{ marginRight: 2, flexShrink: 0 }}>{meta.icon}</span>
                  <Link to={catLink} style={{ fontWeight: 700, color: "#333", textDecoration: "none", flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#FF4400"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#333"; }}>{c.name}</Link>
                  {meta.subs.map((sub) => (
                    <span key={sub} style={{ flexShrink: 0 }}>
                      <span style={{ color: "#e0e0e0", margin: "0 1px" }}>/</span>
                      <Link to={catLink + "&q=" + sub}
                        style={{ color: "#888", textDecoration: "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#FF4400"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>{sub}</Link>
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{ gridRow: "1", gridColumn: "2", borderRadius: 8, overflow: "hidden", height: 200 }}>
            <Carousel autoplay autoplaySpeed={4000} className="hero-carousel">
              {banners.map((b) => (<div key={b.id}><div style={{ background: b.bg, height: 200, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 30px", position: "relative" }}>
                <Tag color="rgba(255,255,255,0.25)" style={{ position: "absolute", top: 10, left: 14, border: "none", color: "#fff", fontSize: 10 }}>{b.tag}</Tag>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{b.t1}</div>
                {b.t2 && <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{b.t2}</div>}
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 6 }}>{b.sub}</div>
              </div></div>))}
            </Carousel>
          </div>
          <div style={{ gridRow: "1", gridColumn: "3", background: "#f7f7f7", borderRadius: 8, padding: "12px 16px", height: 200, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>热门交换 · 品质甄选</span>
              <Tag color="#FF4400" style={{ fontSize: 10 }}>可换</Tag>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {ps.slice(0, 4).map((p) => (<Link to={"/product/" + p.id} key={p.id} style={{ flex: 1, textDecoration: "none", textAlign: "center" }}>
                {p.images[0] && <img src={p.images[0].url} alt="" style={{ width: "85%", maxWidth: 90, aspectRatio: "1", objectFit: "cover", borderRadius: 6 }} />}
                <div><Tag color="#FF4400" style={{ fontSize: 11, fontWeight: 700, border: "none" }}>🪙{p.minPrice.toFixed(0)}</Tag></div>
              </Link>))}
            </div>
          </div>
          <div style={{ gridRow: "1 / 3", gridColumn: "4", background: "#f7f7f7", borderRadius: 8, padding: 16 }}>
            {!user ? (<div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFE0B2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏢</div>
                <div><div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>您好</div><div style={{ fontSize: 11, color: "#999" }}><Link to="/register" style={{ color: "#999" }}>商家入驻</Link></div></div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 4 }}>登录换换开始交换</div>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>库存变资源，以物换物，高效流通</div>
              <Link to="/login"><button style={{ width: "100%", background: "#FF4400", color: "#fff", border: "none", borderRadius: 20, padding: "10px 0", cursor: "pointer", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>立即登录</button></Link>
            </div>) : (<div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFE0B2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 8px" }}>🏢</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Hi，{user.nickname}</div><div style={{ fontSize: 11, color: "#999" }}>欢迎回来</div>
            </div>)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, textAlign: "center", fontSize: 10, color: "#666", borderTop: "1px solid #e8e8e8", marginTop: 14, paddingTop: 10, whiteSpace: "nowrap" }}>
              <Link to="/user/orders" style={{ color: "#666", textDecoration: "none" }}><div style={{ fontSize: 18, marginBottom: 1 }}>🔄</div>交换单</Link>
              <Link to="/user/favorites" style={{ color: "#666", textDecoration: "none" }}><div style={{ fontSize: 18, marginBottom: 1 }}>⭐</div>收藏夹</Link>
              <Link to="/seller/products" style={{ color: "#666", textDecoration: "none" }}><div style={{ fontSize: 18, marginBottom: 1 }}>📦</div>商品</Link>
              <Link to="/user/huanbei" style={{ color: "#666", textDecoration: "none" }}><div style={{ fontSize: 18, marginBottom: 1 }}>🪙</div>换贝</Link>
            </div>
            <div style={{ borderTop: "1px solid #e8e8e8", marginTop: 14, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>换贝充值</div><div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>1换贝 = 1元人民币</div><Link to="/user/huanbei" style={{ fontSize: 11, color: "#FF4400", fontWeight: 600 }}>去充值</Link></div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, position: "relative" }}>🪙<span style={{ position: "absolute", top: -4, right: -6, background: "#FF4400", color: "#fff", fontSize: 8, padding: "1px 3px", borderRadius: 4 }}>换贝</span></div>
            </div>
          </div>
          <div style={{ gridRow: "2", gridColumn: "2 / 4", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {promos.map((card, i) => (<Link to={card.link} key={i} style={{ textDecoration: "none" }}>
              <div style={{ background: "#f7f7f7", borderRadius: 8, padding: "10px 12px" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>{card.title}</span>
                  {card.tag && <Tag color={card.tc} style={{ fontSize: 9, lineHeight: "14px", padding: "0 3px" }}>{card.tag}</Tag>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {ps.slice(card.s[0], card.s[1]).map((p) => (<div key={p.id} style={{ flex: 1, textAlign: "center" }}>
                    {p.images[0] && <img src={p.images[0].url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 4 }} />}
                    <div style={{ color: "#FF4400", fontWeight: 700, fontSize: 11, marginTop: 3 }}>🪙{p.minPrice.toFixed(0)}</div>
                  </div>))}
                </div>
              </div></Link>))}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 8, padding: "10px 24px", marginBottom: 12, display: "flex", gap: 28 }}>
          {tabs.map((t) => (<Link to={"/search?q=" + t.n} key={t.n} style={{ textDecoration: "none", whiteSpace: "nowrap", color: t.hot ? "#FF4400" : "#333", fontSize: 13, fontWeight: t.hot ? 600 : 400 }}>{t.i} {t.n}</Link>))}
        </div>
        {ld ? (<div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {ps.map((p) => (<Link to={"/product/" + p.id} key={p.id} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                {p.images[0] && <img src={p.images[0].url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
                    <span style={{ color: "#FF4400", fontWeight: 700, fontSize: 16 }}>🪙{p.minPrice.toFixed(0)}换贝</span>
                    <span style={{ color: "#ccc", fontSize: 11 }}>{p.salesCount}次交换</span>
                  </div>
                  <div style={{ color: "#999", fontSize: 11, marginTop: 2 }}>{p.shop?.name}</div>
                </div>
              </div></Link>))}
          </div>)}
      </div>
    </div>);
}
