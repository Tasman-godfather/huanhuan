# 实现计划：换换(HuanHuan) 以物换物交易平台

## 概述

基于 React 18 + TypeScript 前端和 Node.js + Express 后端的B2B以物换物交易平台实现计划。采用增量开发方式，从基础设施和核心模型开始，逐步构建换贝系统、商品交换、商家管理等业务模块。

## 任务

- [x] 1. 项目初始化与基础设施搭建
  - [x] 1.1 初始化 monorepo 项目结构
    - 创建 `packages/server` 和 `packages/web` 两个子项目
    - 后端：初始化 Express + TypeScript 项目，配置 Prisma ORM、Redis 客户端、Vitest + fast-check
    - 前端：使用 Vite 初始化 React 18 + TypeScript 项目，配置 Zustand、Ant Design 5、React Router v6、Axios
    - 配置 ESLint、Prettier、tsconfig
    - _需求: 全局_

  - [x] 1.2 定义 Prisma 数据模型 Schema
    - 根据设计文档中的数据模型定义所有 Prisma model（User, Address, Shop, Category, Product, SKU, ProductImage, CartItem, Order, OrderItem, Payment, Logistics, Review, ReviewAppend, ReviewReply, Conversation, Message, Coupon, UserCoupon, Promotion, FlashSaleItem, SearchHistory, Favorite, CheckIn）
    - 定义模型间关系和索引
    - 生成 Prisma Client
    - _需求: 全局数据模型_

  - [x] 1.3 搭建后端基础中间件和工具
    - 实现统一错误响应格式（ErrorResponse 接口）
    - 实现全局错误处理中间件
    - 实现请求验证中间件（使用 zod）
    - 实现 JWT 认证中间件（签发、验证、刷新）
    - 实现角色权限中间件（buyer / seller / admin）
    - 配置 CORS、请求日志
    - _需求: 13.5_

  - [x] 1.4 搭建前端基础架构
    - 配置 Axios 实例（baseURL、请求拦截器添加 JWT、响应拦截器处理 401/403/500 等错误）
    - 创建 Zustand auth store（用户状态、Token 管理）
    - 实现前端路由结构（买家端、卖家端、登录注册页）
    - 实现全局布局组件（NavBar、Footer、Sidebar）
    - _需求: 1.1, 1.7, 1.8_

- [x] 2. 检查点 - 基础设施验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 3. 用户认证与安全模块
  - [x] 3.1 实现用户注册接口
    - POST `/api/auth/register`：支持手机号+验证码和邮箱+密码两种注册方式
    - 密码使用 bcrypt 加密存储
    - 注册成功后自动发放新人优惠券（调用 PromotionService）
    - 返回 JWT Token
    - _需求: 13.1, 12.4_

  - [x] 3.2 实现用户登录接口
    - POST `/api/auth/login`：支持手机号+验证码和邮箱+密码两种登录方式
    - 实现连续 5 次错误密码锁定账户 30 分钟的逻辑
    - 登录成功返回 JWT Token（有效期 7 天）
    - _需求: 13.2, 13.4, 13.5_

  - [x] 3.3 实现验证码发送和密码重置接口
    - POST `/api/auth/send-code`：发送短信/邮件验证码
    - POST `/api/auth/reset-password`：验证码验证后重置密码
    - POST `/api/auth/refresh-token`：刷新 JWT Token
    - _需求: 13.6, 13.5_

  - [ ]* 3.4 编写认证模块属性测试
    - **Property 34: 密码加密 round-trip** — bcrypt 加密后可通过 compare 验证
    - **Property 35: 注册登录 round-trip** — 注册后使用相同凭据登录应成功
    - **Property 36: 账户锁定机制** — 连续 5 次错误密码锁定，30 分钟后解锁
    - **Property 37: JWT 有效期验证** — 7 天内有效，超期失败
    - **Property 38: 密码重置 round-trip** — 重置后新密码可用，旧密码失效
    - **验证: 需求 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**

  - [x] 3.5 实现前端登录注册页面
    - 创建 LoginPage 和 RegisterPage 组件
    - 支持手机号+验证码和邮箱+密码两种表单
    - 实现表单验证、错误提示、登录成功后 Token 存储和页面跳转
    - _需求: 13.1, 13.2_

- [x] 4. 检查点 - 认证模块验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 5. 商品与分类模块
  - [x] 5.1 实现商品分类 CRUD 接口
    - GET `/api/categories`：获取分类树（支持多级分类）
    - 实现 CategoryService，支持分类的增删改查
    - _需求: 1.2_

  - [x] 5.2 实现商品发布与管理接口（卖家端）
    - POST `/api/products`：发布商品（标题、描述、图片、价格、SKU、库存）
    - PUT `/api/products/:id`：编辑商品信息
    - PATCH `/api/products/:id/status`：上架/下架
    - 实现 ProductService，包含商品 CRUD、SKU 管理、图片管理
    - _需求: 7.2, 7.3_

  - [ ]* 5.3 编写商品发布与编辑属性测试
    - **Property 16: 商品发布与编辑持久化** — 发布后查询返回完整信息，编辑后返回更新值，上下架正确切换状态
    - **验证: 需求 7.2, 7.3**

  - [x] 5.4 实现商品列表与详情接口（买家端）
    - GET `/api/products`：商品列表（支持搜索、筛选、排序、分页）
    - GET `/api/products/:id`：商品详情（含 SKU、图片、店铺信息）
    - GET `/api/products/recommendations`：个性化推荐
    - _需求: 3.1-3.9_

  - [ ]* 5.5 编写商品详情属性测试
    - **Property 3: 商品详情页信息完整性** — 详情包含标题、价格、折扣标签、店铺信息；视频排首位
    - **Property 4: SKU 选择联动更新** — 选择 SKU 后价格和库存正确更新
    - **验证: 需求 3.2, 3.3, 3.4, 3.6**

  - [x] 5.6 实现前端商品详情页
    - 创建 ProductDetailPage 组件及子组件（ImageCarousel、ProductInfo、SkuSelector、ProductDescription、ShopCard、ReviewSection、RecommendList、BottomActionBar）
    - 实现图片/视频轮播、SKU 规格选择联动、加入购物车/立即购买操作
    - _需求: 3.1-3.9_

- [x] 6. 搜索模块
  - [x] 6.1 实现搜索后端服务
    - 配置 Elasticsearch 索引（商品标题、描述、分类）
    - 实现 SearchService：关键词搜索、筛选（价格区间/销量/评分/发货地）、排序（综合/销量/价格升降序）
    - GET `/api/search/suggestions`：搜索建议（200ms 内返回）
    - GET `/api/search/history`：搜索历史（最近 20 条，时间倒序）
    - DELETE `/api/search/history`：清除搜索历史
    - _需求: 2.1-2.9_

  - [ ]* 6.2 编写搜索模块属性测试
    - **Property 1: 搜索结果筛选与排序正确性** — 结果匹配关键词、满足筛选条件、按排序规则排列
    - **Property 2: 搜索历史记录管理** — 搜索后记录关键词，最多 20 条倒序，支持清除
    - **验证: 需求 2.2, 2.5, 2.6, 2.7, 2.8, 2.9**

  - [x] 6.3 实现前端搜索页面
    - 创建 SearchPage 组件及子组件（SearchBar、SearchHistory、FilterPanel、SortBar、ViewToggle、ProductGrid/ProductList、Pagination）
    - 实现搜索建议自动补全、筛选面板、排序切换、网格/列表视图切换
    - _需求: 2.1-2.9_

- [x] 7. 检查点 - 商品与搜索模块验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 8. 购物车模块
  - [x] 8.1 实现购物车后端接口
    - GET `/api/cart`：获取购物车（按店铺分组）
    - POST `/api/cart/items`：添加商品（校验库存）
    - PUT `/api/cart/items/:id`：修改数量（限制 1 到可用库存）
    - DELETE `/api/cart/items/:id`：删除商品
    - POST `/api/cart/coupon`：应用优惠券
    - 实现 CartService，包含分组逻辑、选择逻辑、价格计算
    - _需求: 4.1-4.8_

  - [ ]* 8.2 编写购物车属性测试
    - **Property 5: 购物车增删改的正确性** — 添加增加项数、删除移除商品、数量限制在 1 到库存之间
    - **Property 6: 购物车分组与选择逻辑** — 按店铺分组、全选/店铺选择/单选逻辑正确
    - **Property 7: 购物车价格计算正确性** — 总价 = Σ(单价×数量)，优惠券正确扣除
    - **Property 8: 结算到支付的数据传递完整性** — 结算商品与已选商品完全一致
    - **验证: 需求 4.1-4.8**

  - [x] 8.3 实现前端购物车页面
    - 创建 CartPage 组件及子组件（CartHeader、ShopGroup、CartItem、CouponInput、CartFooter）
    - 实现按店铺分组展示、全选/店铺选择/单选、数量调节、实时价格计算、优惠券输入、结算跳转
    - 导航栏购物车图标角标更新
    - _需求: 4.1-4.8_

- [x] 9. 订单与结算模块
  - [x] 9.1 实现收货地址 CRUD 接口
    - 实现 AddressService：新增、编辑、删除、设置默认地址
    - _需求: 5.1, 5.2, 6.3_

  - [ ]* 9.2 编写收货地址属性测试
    - **Property 9: 收货地址 CRUD 正确性** — 新增使数量加 1，编辑更新字段，删除使地址消失，默认地址预选中
    - **验证: 需求 5.1, 5.2, 6.3**

  - [x] 9.3 实现订单创建与管理接口
    - POST `/api/orders`：创建订单（库存校验、金额计算、优惠券核销、地址快照）
    - GET `/api/orders`：订单列表（按状态筛选）
    - GET `/api/orders/:id`：订单详情
    - PATCH `/api/orders/:id/ship`：卖家发货
    - PATCH `/api/orders/:id/confirm`：买家确认收货
    - POST `/api/orders/:id/refund`：申请退款
    - 实现 OrderService，包含订单状态机、金额计算、库存扣减（乐观锁）
    - _需求: 5.3-5.9, 6.2, 7.4_

  - [ ]* 9.4 编写订单模块属性测试
    - **Property 10: 订单金额计算不变量** — 应付金额 = 商品总金额 + 运费 - 优惠金额
    - **Property 11: 库存不足阻止下单** — 请求数量超库存时拒绝并返回具体信息
    - **Property 13: 状态筛选正确性** — 按状态筛选返回的订单全部属于该状态
    - **Property 17: 卖家发货状态流转** — 发货后状态变为已发货，物流信息正确
    - **验证: 需求 5.5, 5.7, 5.9, 6.2, 7.4, 11.1**

  - [x] 9.5 实现前端结算页面
    - 创建 CheckoutPage 组件及子组件（AddressSelector、OrderItemList、PaymentMethodSelector、CouponSelector、OrderSummary、SubmitButton）
    - 实现地址选择/管理、支付方式选择、优惠券选择、费用明细展示、提交订单
    - _需求: 5.1-5.9_

  - [x] 9.6 实现前端订单管理页面
    - 创建 OrderListPage 组件（五状态 Tab 切换：待付款/待发货/待收货/已完成/退款售后）
    - 创建 OrderDetailPage 组件（订单详情、物流信息、操作按钮）
    - _需求: 6.2_

- [x] 10. 检查点 - 购物车与订单模块验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 11. 支付模块
  - [x] 11.1 实现支付后端服务
    - POST `/api/payments`：发起支付（支持余额/银行卡/第三方）
    - GET `/api/payments/:id/status`：查询支付状态
    - POST `/api/payments/callback`：支付回调（验签处理）
    - POST `/api/payments/:id/refund`：退款处理
    - 实现 PaymentService：担保交易状态机（待支付→已支付托管→确认收货释放）、退款逻辑
    - 支付数据加密传输（HTTPS + TLS 1.2+）
    - _需求: 10.1-10.6_

  - [ ]* 11.2 编写支付模块属性测试
    - **Property 27: 担保交易状态机正确性** — 状态流转正确，确认收货触发打款，退款金额等于原支付金额
    - **验证: 需求 10.2, 10.5, 11.5**

- [x] 12. 物流追踪模块
  - [x] 12.1 实现物流后端服务
    - GET `/api/logistics/:orderId`：物流追踪信息
    - 实现 LogisticsService：物流信息查询、物流节点管理、自动确认收货定时任务（发货后 15 天）
    - 对接快递公司 API 接口
    - _需求: 11.1-11.6_

  - [ ]* 12.2 编写物流模块属性测试
    - **Property 28: 物流节点时间线排序** — 节点按时间升序，包含时间/地点/状态描述
    - **Property 29: 自动确认收货** — 发货后 15 天未确认自动确认并触发打款
    - **验证: 需求 11.3, 11.6**

- [x] 13. 评价系统模块
  - [x] 13.1 实现评价后端服务
    - POST `/api/reviews`：提交评价（校验订单已完成、评分 1-5、文字≤500 字、图片≤9 张）
    - POST `/api/reviews/:id/append`：追评（初评后 15 天内仅一次）
    - POST `/api/reviews/:id/reply`：卖家回复（仅一次）
    - GET `/api/products/:id/reviews`：评价列表（时间倒序，支持好评/中评/差评/有图筛选）
    - 实现 ReviewService：评分计算、标签自动生成、权限校验
    - _需求: 8.1-8.7_

  - [ ]* 13.2 编写评价系统属性测试
    - **Property 18: 评价提交权限控制** — 仅已完成订单可评价
    - **Property 19: 评价内容验证** — 评分 1-5，文字≤500 字，图片≤9 张
    - **Property 20: 追评与回复的一次性约束** — 追评 15 天内一次，回复一次
    - **Property 21: 评价排序与筛选** — 默认时间倒序，筛选结果满足条件
    - **Property 22: 平均评分计算正确性** — 平均分 = 总分/评价数，星级占比正确
    - **验证: 需求 8.1-8.6**

  - [x] 13.3 实现前端评价组件
    - 创建评价提交表单（星级选择、文字输入、图片上传）
    - 创建评价列表组件（筛选 Tab、评价卡片、追评展示、卖家回复展示）
    - 集成到商品详情页 ReviewSection
    - _需求: 8.1-8.7_

- [x] 14. 检查点 - 支付、物流、评价模块验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 15. 即时通讯模块
  - [x] 15.1 实现聊天后端服务
    - 配置 Socket.IO 服务器
    - 实现 ChatService：会话管理、消息收发、离线消息存储
    - GET `/api/chat/conversations`：会话列表
    - GET `/api/chat/conversations/:id/messages`：聊天记录（分页加载）
    - WebSocket 事件：chat:message、chat:typing、chat:read、notification:new
    - 文件大小校验（≤10MB）
    - _需求: 9.1-9.6_

  - [ ]* 15.2 编写聊天模块属性测试
    - **Property 23: 聊天消息收发正确性** — 发送的消息出现在消息列表中，按时间升序
    - **Property 24: 文件大小限制** — ≤10MB 接受，>10MB 拒绝
    - **Property 25: 未读消息计数** — 新消息递增，已读后递减
    - **Property 26: 离线消息存储与投递** — 离线消息持久化，上线后可获取
    - **验证: 需求 9.1-9.6**

  - [x] 15.3 实现前端聊天组件
    - 创建 ChatWindow 组件（消息列表、输入框、文件上传）
    - 创建 ConversationList 组件（会话列表、未读角标）
    - 实现 WebSocket 连接管理（自动重连、指数退避）
    - 集成到商品详情页"联系卖家"按钮和卖家中心客服页面
    - _需求: 9.1-9.6_

- [x] 16. 促销与营销模块
  - [x] 16.1 实现促销后端服务
    - GET `/api/promotions/flash-sales`：秒杀活动列表
    - POST `/api/promotions/check-in`：每日签到
    - 实现 PromotionService：秒杀活动管理、满减计算、优惠券创建/分发/核销、签到连续天数计算
    - 实现优惠券 CRUD 和用户优惠券管理（GET `/api/user/coupons`）
    - 实现促销优先级计算（优惠券 → 满减 → 秒杀价，同类不叠加）
    - _需求: 12.1-12.6_

  - [ ]* 16.2 编写促销模块属性测试
    - **Property 30: 满减优惠计算正确性** — 满足门槛扣减，不满足不扣减
    - **Property 31: 促销优先级与叠加规则** — 按优先级计算，同类不叠加
    - **Property 32: 新用户自动发放优惠券** — 注册后自动获得新人券
    - **Property 33: 每日签到连续天数计算** — 连续递增，重复不计，中断重置为 1
    - **验证: 需求 12.2, 12.4, 12.5, 12.6**

- [x] 17. 检查点 - 聊天与促销模块验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 18. 用户中心模块
  - [x] 18.1 实现用户信息与收藏后端接口
    - 实现 UserService：个人信息编辑、浏览历史记录、收藏夹管理
    - GET/PUT 用户个人信息接口
    - GET/POST/DELETE 收藏接口
    - GET 浏览历史接口（按日期分组）
    - _需求: 6.1, 6.4, 6.5_

  - [ ]* 18.2 编写用户中心属性测试
    - **Property 12: 用户信息与店铺信息更新持久化** — 编辑后重新查询返回更新值
    - **Property 14: 收藏夹增删正确性** — 收藏后出现，取消后消失
    - **Property 15: 浏览历史按日期分组** — 同组同天，组间日期降序
    - **验证: 需求 6.1, 6.4, 6.5, 7.1**

  - [x] 18.3 实现前端用户中心页面
    - 创建 UserCenterPage 及子页面（ProfilePage、OrderListPage、AddressPage、FavoritesPage、BrowsingHistoryPage、CouponPage、MessageCenter、SecurityPage）
    - 实现侧边导航菜单、个人信息编辑、收藏夹、浏览历史、优惠券管理、消息通知、账户安全设置
    - _需求: 6.1-6.8_

- [x] 19. 卖家中心模块
  - [x] 19.1 实现卖家店铺管理接口
    - 实现 ShopService：店铺信息编辑、店铺装修配置
    - GET `/api/seller/analytics`：数据分析（访问量、销售额、订单量、转化率）
    - 卖家营销工具接口（创建店铺优惠券、满减活动）
    - _需求: 7.1, 7.5, 7.6_

  - [x] 19.2 实现前端卖家中心页面
    - 创建 SellerCenterPage 及子页面（ShopSettingsPage、ProductManagePage、OrderManagePage、AnalyticsDashboard、MarketingToolsPage、CustomerServicePage）
    - 实现商品发布/编辑表单、订单管理（发货/退款）、数据分析图表、营销工具
    - _需求: 7.1-7.7_

- [x] 20. 首页模块
  - [x] 20.1 实现首页后端接口
    - 首页数据聚合接口：Banner 列表、秒杀活动、热门品类、推荐商品
    - _需求: 1.1-1.8_

  - [x] 20.2 实现前端首页
    - 创建 HomePage 组件及子组件（NavBar、CategoryNav、BannerCarousel、FlashSaleSection、CategoryQuickLinks、RecommendationFeed、Footer）
    - 实现轮播广告（自动/手动切换）、秒杀倒计时、品类快捷入口、推荐瀑布流
    - 应用橙红色主色调（#FF4400 / #FF5000）
    - _需求: 1.1-1.8_

- [x] 21. 检查点 - 用户中心、卖家中心、首页验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 22. 全模块集成与联调
  - [x] 22.1 前后端接口联调
    - 确保所有前端页面与后端 API 正确对接
    - 验证完整购物流程：注册 → 搜索 → 商品详情 → 加购 → 结算 → 支付 → 物流 → 确认收货 → 评价
    - 验证卖家流程：开店 → 发布商品 → 处理订单 → 发货 → 数据分析
    - _需求: 全局_

  - [x] 22.2 实现前端错误处理与降级
    - 统一处理 API 超时、401/403/404/422/500 错误
    - WebSocket 断连自动重连（指数退避）
    - 图片加载失败占位图
    - _需求: 全局错误处理_

  - [ ]* 22.3 编写关键流程集成测试
    - 测试完整购物流程的数据流转
    - 测试并发场景（秒杀抢购、库存扣减）
    - _需求: 全局_

- [x] 23. 最终检查点 - 全部测试通过
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了具体的需求编号，确保需求可追溯
- 检查点任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证设计文档中定义的 38 个正确性属性
- 单元测试验证具体示例和边界情况
- 需求 14（直播购物）为可选高级功能，未包含在当前任务列表中，可后续迭代添加
