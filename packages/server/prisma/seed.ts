import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const U = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`;

const CATEGORIES = [
  { name: '茶叶', icon: '🍵', products: [
    { title: '安溪铁观音 特级浓香型 500g礼盒装', price: 580, originalPrice: 880, desc: '正宗安溪铁观音，传统半发酵工艺，回甘持久，适合商务送礼', want: '白酒、红酒', imgUrls: [U('photo-1760074057726-e94ee8ff1eb4'), U('photo-1760074057731-83e375873eb5'), U('photo-1765075837214-6d7da26a9010')] },
    { title: '云南普洱茶 古树生茶饼 357g', price: 420, originalPrice: 680, desc: '勐海古树茶园，百年古树原料，陈化潜力大，越陈越香', want: '咖啡、食用油', imgUrls: [U('photo-1765808776085-408b349eec48'), U('photo-1628153792464-21bffac488d4'), U('photo-1600368140356-0564107deea7')] },
    { title: '西湖龙井 明前特级 250g罐装', price: 680, originalPrice: 1200, desc: '核心产区狮峰山，手工炒制，豆香馥郁，绿茶极品', want: '电子产品、办公用品', imgUrls: [U('photo-1765188987896-dfc20b28b6ce'), U('photo-1760074057726-53a88633cf67'), U('photo-1760884966322-207bd5afdd77')] },
    { title: '福鼎白茶 白毫银针 250g', price: 520, originalPrice: 880, desc: '太姥山高山产区，单芽采摘，毫香蜜韵，存放越久越好', want: '服装、家纺', imgUrls: [U('photo-1727175435292-f5d6b9aa7ba5'), U('photo-1727175435643-12b61eaeeec4'), U('photo-1727175435236-c9c4603e11a0')] },
    { title: '武夷山大红袍 特级岩茶 200g', price: 760, originalPrice: 1280, desc: '正岩产区，传统炭焙工艺，岩骨花香，品质极优', want: '白酒、保健品', imgUrls: [U('photo-1760074057746-388f7e66c61e'), U('photo-1773638662982-64e9bd3951fb'), U('photo-1765809701590-df28ba4f85eb')] },
  ]},
  { name: '白酒', icon: '🍶', products: [
    { title: '贵州茅台镇酱香白酒 53度 500ml', price: 380, originalPrice: 580, desc: '茅台镇核心产区，坤沙工艺酿造，酱香突出回味悠长', want: '茶叶、食用油', imgUrls: [U('photo-1562601579-599dec564e06'), U('photo-1544782321-8fab42cfd62e'), U('photo-1698063126115-7ba800c43289')] },
    { title: '五粮浓香型白酒 52度 500ml礼盒', price: 280, originalPrice: 460, desc: '五粮精酿，浓香典范，窖香浓郁，绵甜净爽', want: '大米、食品', imgUrls: [U('photo-1556442281-77c90134c61f'), U('photo-1717460654164-4430727be1a6'), U('photo-1766204176701-1e4234cbbb1d')] },
    { title: '山西汾酒 清香型 42度 500ml', price: 168, originalPrice: 280, desc: '杏花村正宗汾酒，清香纯正，入口柔和，适合日常饮用', want: '茶叶、零食', imgUrls: [U('photo-1554230561-31bdc707b537'), U('photo-1620160428336-bd4dd3e90415'), U('photo-1601506340309-07309cf0c4a0')] },
    { title: '泸州老窖特曲 52度 500ml*6瓶整箱', price: 1280, originalPrice: 1980, desc: '浓香型经典代表，国窖窖池酿造，商务宴请首选', want: '电子设备、办公家具', imgUrls: [U('photo-1729717611433-cba4abcb21c2'), U('photo-1693913109537-9eb36b9eda25'), U('photo-1770345031555-c79f9552ec92')] },
    { title: '绍兴黄酒 陈年花雕 500ml*12瓶', price: 320, originalPrice: 520, desc: '绍兴原产，5年陈酿，适合料酒和日常饮用', want: '水果、农产品', imgUrls: [U('photo-1758827926633-621fb8694e6e'), U('photo-1744233277849-029cd7f525d2'), U('photo-1769521711111-741c5978c464')] },
  ]},
  { name: '食品', icon: '🌾', products: [
    { title: '东北五常大米 有机长粒香 25kg', price: 189, originalPrice: 298, desc: '五常核心产区，有机认证，颗粒饱满煮饭香糯', want: '茶叶、日化用品', imgUrls: [U('photo-1584269903637-e1b1c717a2b4'), U('photo-1644377949116-c4a6b529241c'), U('photo-1633536706496-873ce0d46277')] },
    { title: '西班牙特级初榨橄榄油 1L*2瓶', price: 268, originalPrice: 420, desc: '西班牙原装进口，冷压初榨，酸度≤0.8%，烹饪健康油', want: '白酒、坚果', imgUrls: [U('photo-1474979266404-7f28e15c4168'), U('photo-1457414104202-9d4b4908f285'), U('photo-1645331465778-eb409d112198')] },
    { title: '新疆若羌灰枣 一级 5kg装', price: 128, originalPrice: 218, desc: '新疆若羌原产，自然晾晒，肉厚核小，甜度高', want: '服装、日化', imgUrls: [U('photo-1562557309-bf9e46b0670d'), U('photo-1561102304-85d096b64a27'), U('photo-1745680636997-dca47973113d')] },
    { title: '云南小粒咖啡豆 精品水洗 1kg', price: 158, originalPrice: 268, desc: '云南保山精品咖啡豆，水洗加工，中度烘焙，风味均衡', want: '茶叶、零食', imgUrls: [U('photo-1447933601403-56dc2b5d9502'), U('photo-1559056199-641a0ac8b55e'), U('photo-1497935586351-b67a49e012bf')] },
    { title: '内蒙古风干牛肉干 原味 500g*3包', price: 218, originalPrice: 358, desc: '锡林郭勒草原黄牛肉，传统风干工艺，高蛋白零添加', want: '水果、粮油', imgUrls: [U('photo-1551028150-64b9f398f678'), U('photo-1529692236671-f1f6cf9683ba'), U('photo-1646451403191-0d763de28fc2')] },
  ]},
  { name: '服装纺织', icon: '👗', products: [
    { title: '商务男士纯棉长袖衬衫 100件起', price: 4500, originalPrice: 6800, desc: '精梳棉面料，免烫工艺，适合企业团购和经销商', want: '食品、日化用品', imgUrls: [U('photo-1670490340295-95b418fe59a4'), U('photo-1610637018413-166d2c5755c7'), U('photo-1517472292914-9570a594783b')] },
    { title: '女士真丝围巾 桑蚕丝 50条起', price: 3800, originalPrice: 5500, desc: '100%桑蚕丝，数码印花，轻薄透气，适合批量采购', want: '茶叶、美妆', imgUrls: [U('photo-1758264839086-2bdecc06d9a3'), U('photo-1768744326593-50f2c9ad0d53'), U('photo-1600166931532-604e927c794b')] },
    { title: '全棉工装T恤 定制印花 200件起', price: 5600, originalPrice: 8200, desc: '260g重磅棉，企业团体定制，质量稳定色牢度高', want: '电子产品、办公用品', imgUrls: [U('photo-1652385840690-1d9671b6177a'), U('photo-1717145661112-3742a0f4cdd0'), U('photo-1690967707362-96563aedb181')] },
    { title: '冬季加厚羽绒服 男女款 50件起', price: 12500, originalPrice: 19800, desc: '90%白鸭绒，充绒量180g，防风防水面料，库存尾货', want: '食品、建材', imgUrls: [U('photo-1722694583723-b75de0918c44'), U('photo-1711644620740-99a99b6568ef'), U('photo-1600166931602-3b261ecec326')] },
    { title: '亚麻床品四件套 60支 100套起', price: 18000, originalPrice: 28000, desc: '法国亚麻原料，60支高支高密，透气吸湿', want: '电器、家具', imgUrls: [U('photo-1652385907489-669c79c0c25d'), U('photo-1764777151277-efa2e162306a'), U('photo-1652385939737-3aa227420cb1')] },
  ]},
  { name: '电子数码', icon: '📱', products: [
    { title: '蓝牙耳机 降噪TWS 500个起', price: 15000, originalPrice: 24500, desc: '主动降噪，蓝牙5.3，30小时续航，适合渠道分销', want: '食品、酒水', imgUrls: [U('photo-1760410780969-07be31532d45'), U('photo-1771707164892-57c8c6d015e6'), U('photo-1771707164795-616362a69840')] },
    { title: '智能手环 心率血氧 200个起', price: 8800, originalPrice: 14200, desc: '1.47英寸彩屏，心率血氧监测，14天续航，IP68防水', want: '茶叶、服装', imgUrls: [U('photo-1773470258071-a93f031d8e06'), U('photo-1771707164842-5d706fb4216a'), U('photo-1627989580309-bfaf3e58af6f')] },
    { title: '充电宝 20000mAh 300个起', price: 12000, originalPrice: 18900, desc: '20000mAh大容量，22.5W快充，LED数显，企业定制', want: '食品、日化', imgUrls: [U('photo-1760201550893-8fee4b80c00c'), U('photo-1762553159827-7a5d2167b55d'), U('photo-1770292170233-5d9e235ec739')] },
    { title: 'LED护眼台灯 300台起', price: 18000, originalPrice: 28500, desc: 'AA级照度，无频闪无蓝光，触控调光，USB充电口', want: '服装、家纺', imgUrls: [U('photo-1532007271951-c487760934ae'), U('photo-1674659719067-8735479ba10c'), U('photo-1675287850864-8e3c26080a0b')] },
    { title: '机械键盘 热插拔RGB 100个起', price: 9800, originalPrice: 15800, desc: '全键热插拔，PBT键帽，RGB灯效，多轴体可选', want: '食品、酒水', imgUrls: [U('photo-1765551097111-724e1a5cdf8f'), U('photo-1758642538875-6e70821ff0a5'), U('photo-1754821130715-318b3615bde8')] },
  ]},
  { name: '美妆日化', icon: '💄', products: [
    { title: '氨基酸洗面奶 200ml 500支起', price: 7500, originalPrice: 12000, desc: '氨基酸表活，温和清洁，适合代理分销和企业福利', want: '食品、电子产品', imgUrls: [U('photo-1577058109956-67adf6edc586'), U('photo-1697840507245-e6ce44da4e4c'), U('photo-1595847199435-6904622474a2')] },
    { title: '保湿面膜 10片装 200盒起', price: 6800, originalPrice: 10500, desc: '玻尿酸精华液，补水保湿，蚕丝面膜材质', want: '茶叶、服装', imgUrls: [U('photo-1556228720-74787810a501'), U('photo-1741896136071-3f8c1d472aa8'), U('photo-1611080541599-8c6dbde6ed28')] },
    { title: '护手霜 50ml 1000支起', price: 5000, originalPrice: 8500, desc: '乳木果油配方，滋润不黏腻，适合企业礼品', want: '食品、办公用品', imgUrls: [U('photo-1594527964562-32ed6eb11709'), U('photo-1594332322527-08753d4473c1'), U('photo-1697840526083-34c4367b79fa')] },
    { title: '男士洗发沐浴套装 300套起', price: 9000, originalPrice: 14500, desc: '无硅油洗发+氨基酸沐浴，旅行装套盒', want: '酒水、零食', imgUrls: [U('photo-1776015036380-4022fe844ed8'), U('photo-1776015036303-1087ac99dc4f'), U('photo-1741896136113-c33a4fded0b5')] },
    { title: '防晒喷雾 SPF50+ 150ml 500支起', price: 12500, originalPrice: 19500, desc: '物化结合防晒，清爽不黏腻，户外运动必备', want: '服装、电子', imgUrls: [U('photo-1611080541626-4ecc5ead618d'), U('photo-1686575131299-6e56fe3fc17b'), U('photo-1611080541716-4de04385fbae')] },
  ]},
  { name: '家居建材', icon: '🏠', products: [
    { title: '智能扫地机器人 100台起', price: 45000, originalPrice: 68000, desc: 'LDS激光导航，3000Pa吸力，自动集尘，APP控制', want: '食品、酒水', imgUrls: [U('photo-1765766601447-9e11ad2356da'), U('photo-1762856490803-8e200418973a'), U('photo-1770381142493-075344e6fc9b')] },
    { title: '日式陶瓷餐具套装 16件套 200套起', price: 12000, originalPrice: 19800, desc: '高温釉下彩，安全无铅，微波炉可用', want: '服装、纺织品', imgUrls: [U('photo-1548688977-3e38ddc590f6'), U('photo-1604414499020-f9ac575bc5ec'), U('photo-1511224931379-b4e4324ea7fc')] },
    { title: '竹纤维毛巾 100条起', price: 2800, originalPrice: 4500, desc: '天然竹纤维，抗菌柔软，吸水性强', want: '食品、茶叶', imgUrls: [U('photo-1633253037482-42b88325b64c'), U('photo-1571266313385-20c0cb974641'), U('photo-1727840732811-7b58df7c911b')] },
    { title: '实木办公桌 20张起', price: 18000, originalPrice: 28000, desc: '橡胶木实木，环保水性漆，适合办公室配置', want: '电子产品、食品', imgUrls: [U('photo-1611269154421-4e27233ac5c7'), U('photo-1679309981674-cef0e23a7864'), U('photo-1604074131665-7a4b13870ab4')] },
    { title: 'LED筒灯 1000只起', price: 8000, originalPrice: 13500, desc: '嵌入式LED筒灯，3000K暖白光，高光效节能', want: '食品、日化', imgUrls: [U('photo-1608429700640-453a5a242edf'), U('photo-1612523563676-709f47fab6ea'), U('photo-1632815804501-c43dfd1a4578')] },
  ]},
  { name: '农产品', icon: '🌿', products: [
    { title: '赣南脐橙 特级 20斤装 100箱起', price: 8500, originalPrice: 13800, desc: '赣南原产地直供，果大皮薄汁多，甜度高', want: '白酒、日化用品', imgUrls: [U('photo-1611080626919-7cf5a9dbab5b'), U('photo-1547514701-42782101795e'), U('photo-1543076659-9380cdf10613')] },
    { title: '云南鲜花饼 玫瑰味 50盒起', price: 3800, originalPrice: 6200, desc: '新鲜食用玫瑰，酥皮层层分明，云南特产伴手礼', want: '茶叶、坚果', imgUrls: [U('photo-1514936477380-5ea603b9a1ca'), U('photo-1620217491382-4772d58bc863'), U('photo-1643996317182-5b01f9725953')] },
    { title: '阳澄湖大闸蟹 礼券 100张起', price: 28000, originalPrice: 42000, desc: '阳澄湖原产，公4.0两母3.0两，4对装礼券', want: '白酒、电子产品', imgUrls: [U('photo-1580052614034-c55d20bfee3b'), U('photo-1591206369811-4eeb2f03bc95'), U('photo-1626062985882-07e999ea0ea5')] },
    { title: '新疆库尔勒香梨 10kg 50箱起', price: 4500, originalPrice: 7200, desc: '库尔勒原产，皮薄肉细，汁多味甜', want: '服装、日化', imgUrls: [U('photo-1631148601579-9e20bf28ab59'), U('photo-1643996328486-c689aa05e73f'), U('photo-1722581628287-fffddabb87d1')] },
  ]},
  { name: '工业品', icon: '⚙️', products: [
    { title: '一次性手套 丁腈材质 100箱起', price: 15000, originalPrice: 24000, desc: '医疗级丁腈手套，无粉设计，S/M/L码齐全', want: '食品、办公用品', imgUrls: [U('photo-1584820927498-cfe5211fd8bf'), U('photo-1584819762556-68601d7f3a86'), U('photo-1599412227383-b7d4751c8765')] },
    { title: '包装纸箱 12号 1000个起', price: 3500, originalPrice: 5800, desc: '三层瓦楞纸，加厚加硬，快递电商通用', want: '食品、日化', imgUrls: [U('photo-1628235176517-71013205a2de'), U('photo-1619691114448-d136c0890914'), U('photo-1623657756153-3104597e7ad8')] },
    { title: '劳保工作服 夏季薄款 200套起', price: 8000, originalPrice: 12800, desc: '纯棉透气面料，反光条设计，企业定制logo', want: '食品、电子', imgUrls: [U('photo-1611075383964-4717534173f3'), U('photo-1651493752755-1186e1227efc'), U('photo-1611075385356-1f295304c68e')] },
    { title: 'KN95口罩 独立包装 500盒起', price: 12000, originalPrice: 19500, desc: '五层过滤，独立包装，符合国标GB2626', want: '食品、酒水', imgUrls: [U('photo-1691935444158-52240fda25e6'), U('photo-1765959990052-fab57c043979'), U('photo-1766598282663-37629b017d20')] },
    { title: '办公打印纸 A4 70g 200箱起', price: 7200, originalPrice: 11000, desc: '双面打印不透底，500张/包，5包/箱', want: '食品、茶叶', imgUrls: [U('photo-1616868560403-b4675d3a545b'), U('photo-1708200216322-9463ac285552'), U('photo-1625655164397-08d7b11ab280')] },
  ]},
];

async function main() {
  console.log('🌱 开始填充种子数据...\n');

  console.log('🧹 清理旧数据...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.flashSaleItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.exchangeRequest.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.reviewReply.deleteMany();
  await prisma.reviewAppend.deleteMany();
  await prisma.review.deleteMany();
  await prisma.logistics.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.flashSaleItem.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.huanbeiRecord.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('👑 创建超级管理员...');
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: { email: 'admin@huanhuan.com', passwordHash, nickname: '超级管理员', role: 'admin', phone: '13800000000', companyName: '换换平台管理', huanbeiBalance: 0, depositAmount: 0 },
  });
  console.log('   admin@huanhuan.com / 123456');

  console.log('👤 创建商家用户...');

  const merchant1 = await prisma.user.create({
    data: { email: 'tea@huanhuan.com', passwordHash, nickname: '福建茶叶集团', role: 'merchant', phone: '13800000001', companyName: '福建茶叶集团有限公司', huanbeiBalance: 50000, depositAmount: 50000 },
  });
  const merchant2 = await prisma.user.create({
    data: { email: 'wine@huanhuan.com', passwordHash, nickname: '贵州酒业', role: 'merchant', phone: '13800000002', companyName: '贵州酒业股份有限公司', huanbeiBalance: 80000, depositAmount: 80000 },
  });
  const merchant3 = await prisma.user.create({
    data: { email: 'food@huanhuan.com', passwordHash, nickname: '东北粮油', role: 'merchant', phone: '13800000003', companyName: '东北粮油贸易有限公司', huanbeiBalance: 30000, depositAmount: 30000 },
  });
  const merchant4 = await prisma.user.create({
    data: { email: 'textile@huanhuan.com', passwordHash, nickname: '江浙纺织', role: 'merchant', phone: '13800000004', companyName: '江浙纺织实业集团', huanbeiBalance: 100000, depositAmount: 100000 },
  });

  console.log('🏪 创建店铺...');
  const shop1 = await prisma.shop.create({ data: { sellerId: merchant1.id, name: '福建茶叶集团旗舰店', description: '专注高品质茶叶，原产地直供，支持以物换物', rating: 4.8, followerCount: 12580 } });
  const shop2 = await prisma.shop.create({ data: { sellerId: merchant2.id, name: '贵州名酒交换中心', description: '正品白酒，厂家直供，接受各类商品交换', rating: 4.9, followerCount: 35620 } });
  const shop3 = await prisma.shop.create({ data: { sellerId: merchant3.id, name: '东北粮油供应链', description: '优质粮油，产地直发，欢迎以物换物', rating: 4.7, followerCount: 8930 } });
  const shop4 = await prisma.shop.create({ data: { sellerId: merchant4.id, name: '江浙纺织品交易中心', description: '服装纺织品批量交换，品质保证', rating: 4.6, followerCount: 6720 } });

  const shopMap: Record<string, string> = {
    '茶叶': shop1.id, '白酒': shop2.id,
    '食品': shop3.id, '服装纺织': shop4.id,
    '电子数码': shop2.id, '美妆日化': shop3.id,
    '家居建材': shop4.id, '农产品': shop3.id,
    '工业品': shop4.id,
  };

  let totalProducts = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    console.log(`📦 创建分类: ${cat.icon} ${cat.name} (${cat.products.length} 个商品)`);

    const category = await prisma.category.create({
      data: { name: cat.name, icon: cat.icon, sortOrder: i },
    });

    for (const p of cat.products) {
      const shopId = shopMap[cat.name];
      const salesCount = Math.floor(Math.random() * 500) + 10;
      const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
      const reviewCount = Math.floor(salesCount * 0.3);

      const product = await prisma.product.create({
        data: {
          shopId, categoryId: category.id,
          title: p.title, description: `<p>${p.desc}</p><p>支持以物换物，品质保证。</p>`,
          minPrice: p.price, maxPrice: p.originalPrice,
          salesCount, rating, reviewCount,
          status: 'active',
          wantItems: p.want,
          skus: {
            create: [
              { specs: { '默认': '标准款' }, price: p.price, originalPrice: p.originalPrice, stock: Math.floor(Math.random() * 500) + 50 },
            ],
          },
          images: {
            create: p.imgUrls.map((url, idx) => ({
              url,
              sortOrder: idx,
              type: idx < 2 ? 'main' : 'detail',
            })),
          },
        },
      });
      totalProducts++;
    }
  }

  console.log('📍 创建收货地址...');
  await prisma.address.create({
    data: { userId: merchant1.id, name: '张经理', phone: '13800000001', province: '福建省', city: '厦门市', district: '思明区', detail: '软件园二期 换换大厦 8楼', isDefault: true },
  });
  await prisma.address.create({
    data: { userId: merchant2.id, name: '李总', phone: '13800000002', province: '贵州省', city: '遵义市', district: '仁怀市', detail: '茅台镇 名酒大道 28号', isDefault: true },
  });

  console.log('🪙 创建换贝充值记录...');
  await prisma.huanbeiRecord.create({
    data: { userId: merchant1.id, amount: 50000, type: 'deposit', remark: '入驻押金充值' },
  });
  await prisma.huanbeiRecord.create({
    data: { userId: merchant2.id, amount: 80000, type: 'deposit', remark: '入驻押金充值' },
  });
  await prisma.huanbeiRecord.create({
    data: { userId: merchant3.id, amount: 30000, type: 'deposit', remark: '入驻押金充值' },
  });
  await prisma.huanbeiRecord.create({
    data: { userId: merchant4.id, amount: 100000, type: 'deposit', remark: '入驻押金充值' },
  });

  console.log('\n=============================');
  console.log(`✅ 种子数据填充完成！`);
  console.log(`   商家: 4 个`);
  console.log(`   店铺: 4 个`);
  console.log(`   分类: ${CATEGORIES.length} 个`);
  console.log(`   商品: ${totalProducts} 个`);
  console.log(`   图片来源: Unsplash (精选高清商品图片)`);
  console.log('');
  console.log('   测试账号:');
  console.log('   茶叶商 - tea@huanhuan.com / 123456 (50000换贝)');
  console.log('   酒商   - wine@huanhuan.com / 123456 (80000换贝)');
  console.log('   粮油商 - food@huanhuan.com / 123456 (30000换贝)');
  console.log('   纺织商 - textile@huanhuan.com / 123456 (100000换贝)');
  console.log('=============================\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
