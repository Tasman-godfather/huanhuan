import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database from local dump...');

  // Clean
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.flashSaleItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.checkIn.deleteMany();
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
  await prisma.productImage.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.huanbeiRecord.deleteMany();
  await prisma.exchangeRequest.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.create({ data: {"nickname":"超级管理员","email":"admin@huanhuan.com","phone":"13800000000","passwordHash":passwordHash,"role":"admin","status":"active","huanbeiBalance":0,"depositAmount":0,"companyName":"换换平台管理","businessLicense":null} });
  await prisma.user.create({ data: {"nickname":"福建茶叶集团","email":"tea@huanhuan.com","phone":"13800000001","passwordHash":passwordHash,"role":"merchant","status":"active","huanbeiBalance":50000,"depositAmount":50000,"companyName":"福建茶叶集团有限公司","businessLicense":null} });
  await prisma.user.create({ data: {"nickname":"贵州酒业","email":"wine@huanhuan.com","phone":"13800000002","passwordHash":passwordHash,"role":"merchant","status":"active","huanbeiBalance":80000,"depositAmount":80000,"companyName":"贵州酒业股份有限公司","businessLicense":null} });
  await prisma.user.create({ data: {"nickname":"东北粮油","email":"food@huanhuan.com","phone":"13800000003","passwordHash":passwordHash,"role":"merchant","status":"active","huanbeiBalance":30000,"depositAmount":30000,"companyName":"东北粮油贸易有限公司","businessLicense":null} });
  await prisma.user.create({ data: {"nickname":"江浙纺织","email":"textile@huanhuan.com","phone":"13800000004","passwordHash":passwordHash,"role":"merchant","status":"active","huanbeiBalance":100000,"depositAmount":100000,"companyName":"江浙纺织实业集团","businessLicense":null} });
  await prisma.user.create({ data: {"nickname":"1","email":"414194762@qq.com","phone":null,"passwordHash":passwordHash,"role":"merchant","status":"active","huanbeiBalance":200000,"depositAmount":0,"companyName":"1","businessLicense":null} });

  // Categories
  const catMap: Record<string, string> = {};
  catMap['efa57240-9d69-4805-a49c-808f61d9725f'] = (await prisma.category.create({ data: { name: "茶叶", icon: "🍵", sortOrder: 0 } })).id;
  catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'] = (await prisma.category.create({ data: { name: "白酒", icon: "🍶", sortOrder: 1 } })).id;
  catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'] = (await prisma.category.create({ data: { name: "食品", icon: "🌾", sortOrder: 2 } })).id;
  catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'] = (await prisma.category.create({ data: { name: "服装纺织", icon: "👗", sortOrder: 3 } })).id;
  catMap['b7b9df60-a90d-4907-a724-16a9ac433543'] = (await prisma.category.create({ data: { name: "电子数码", icon: "📱", sortOrder: 4 } })).id;
  catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'] = (await prisma.category.create({ data: { name: "美妆日化", icon: "💄", sortOrder: 5 } })).id;
  catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'] = (await prisma.category.create({ data: { name: "家居建材", icon: "🏠", sortOrder: 6 } })).id;
  catMap['dbbc22cf-0fe3-49dd-a7ce-c5fb775ab018'] = (await prisma.category.create({ data: { name: "农产品", icon: "🌿", sortOrder: 7 } })).id;
  catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'] = (await prisma.category.create({ data: { name: "工业品", icon: "⚙️", sortOrder: 8 } })).id;

  // Shops
  const shopMap: Record<string, string> = {};
  { const seller = await prisma.user.findUnique({ where: { email: "tea@huanhuan.com" } }); if (seller) { shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'] = (await prisma.shop.create({ data: { sellerId: seller.id, name: "福建茶叶集团旗舰店", logo: null, description: "专注高品质茶叶，原产地直供，支持以物换物", rating: 4.8, followerCount: 12580 } })).id; } }
  { const seller = await prisma.user.findUnique({ where: { email: "wine@huanhuan.com" } }); if (seller) { shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'] = (await prisma.shop.create({ data: { sellerId: seller.id, name: "贵州名酒交换中心", logo: null, description: "正品白酒，厂家直供，接受各类商品交换", rating: 4.9, followerCount: 35620 } })).id; } }
  { const seller = await prisma.user.findUnique({ where: { email: "food@huanhuan.com" } }); if (seller) { shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'] = (await prisma.shop.create({ data: { sellerId: seller.id, name: "东北粮油供应链", logo: null, description: "优质粮油，产地直发，欢迎以物换物", rating: 4.7, followerCount: 8930 } })).id; } }
  { const seller = await prisma.user.findUnique({ where: { email: "textile@huanhuan.com" } }); if (seller) { shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'] = (await prisma.shop.create({ data: { sellerId: seller.id, name: "江浙纺织品交易中心", logo: null, description: "服装纺织品批量交换，品质保证", rating: 4.6, followerCount: 6720 } })).id; } }
  { const seller = await prisma.user.findUnique({ where: { email: "414194762@qq.com" } }); if (seller) { shopMap['356124d6-dcf0-4423-8efc-6492e3ef7145'] = (await prisma.shop.create({ data: { sellerId: seller.id, name: "1", logo: null, description: null, rating: 0, followerCount: 0 } })).id; } }

  // Products
  await prisma.product.create({ data: {
    shopId: shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'], categoryId: catMap['efa57240-9d69-4805-a49c-808f61d9725f'],
    title: "安溪铁观音 特级浓香型 500g礼盒装", description: "<p>正宗安溪铁观音，传统半发酵工艺，回甘持久，适合商务送礼支持以物换物，品质保证。</p>",
    minPrice: 580, maxPrice: 580, salesCount: 272,
    rating: 3.9, reviewCount: 81, status: 'active',
    videoUrl: null, wantItems: "白酒、红酒",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 580, originalPrice: 880, stock: 375, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/47123c4d-9e0e-497b-9af9-a4ddf51a2f48.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'], categoryId: catMap['efa57240-9d69-4805-a49c-808f61d9725f'],
    title: "云南普洱茶 古树生茶饼 357g", description: "<p>勐海古树茶园，百年古树原料，陈化潜力大，越陈越香</p><p>支持以物换物，品质保证。</p>",
    minPrice: 420, maxPrice: 680, salesCount: 97,
    rating: 3.6, reviewCount: 29, status: 'active',
    videoUrl: null, wantItems: "咖啡、食用油",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 420, originalPrice: 680, stock: 109, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1765808776085-408b349eec48?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1628153792464-21bffac488d4?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1600368140356-0564107deea7?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'], categoryId: catMap['efa57240-9d69-4805-a49c-808f61d9725f'],
    title: "西湖龙井 明前特级 250g罐装", description: "<p>核心产区狮峰山，手工炒制，豆香馥郁，绿茶极品支持以物换物，品质保证。</p>",
    minPrice: 680, maxPrice: 680, salesCount: 179,
    rating: 4.1, reviewCount: 53, status: 'active',
    videoUrl: null, wantItems: "电子产品、办公用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 680, originalPrice: 1200, stock: 111, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/06c192d5-c7e5-4f01-8b8d-b6c95ff07225.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'], categoryId: catMap['efa57240-9d69-4805-a49c-808f61d9725f'],
    title: "福鼎白茶 白毫银针 250g", description: "<p>太姥山高山产区，单芽采摘，毫香蜜韵，存放越久越好支持以物换物，品质保证。</p>",
    minPrice: 520, maxPrice: 520, salesCount: 333,
    rating: 3.7, reviewCount: 99, status: 'active',
    videoUrl: null, wantItems: "服装、家纺",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 520, originalPrice: 880, stock: 78, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/ce972055-33e9-4312-b2cd-f18eccbd9c07.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['6deb2424-c1f4-43eb-a25d-e368167c6efd'], categoryId: catMap['efa57240-9d69-4805-a49c-808f61d9725f'],
    title: "铁观音", description: "<p>正岩产区，传统炭焙工艺，岩骨花香，品质极优支持以物换物，品质保证。</p>",
    minPrice: 500, maxPrice: 500, salesCount: 120,
    rating: 4.8, reviewCount: 36, status: 'active',
    videoUrl: null, wantItems: "白酒、保健品",
    skus: { create: [{ specs: {}, price: 500, originalPrice: 800, stock: 100, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/997c22b7-0ce0-4685-8fbd-ef97e6ab2f2b.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "贵州茅台镇酱香白酒 53度 500ml", description: "<p>茅台镇核心产区，坤沙工艺酿造，酱香突出回味悠长支持以物换物，品质保证。</p>",
    minPrice: 380, maxPrice: 380, salesCount: 194,
    rating: 4.8, reviewCount: 58, status: 'active',
    videoUrl: null, wantItems: "茶叶、食用油",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 380, originalPrice: 580, stock: 141, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/51d7bd8d-cb42-49d9-a05b-01fcd678ae7d.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "五粮浓香型白酒 52度 500ml礼盒", description: "<p>五粮精酿，浓香典范，窖香浓郁，绵甜净爽支持以物换物，品质保证。</p>",
    minPrice: 280, maxPrice: 280, salesCount: 77,
    rating: 4.8, reviewCount: 23, status: 'active',
    videoUrl: null, wantItems: "大米、食品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 280, originalPrice: 460, stock: 374, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/a6d40f35-e3bd-403c-89a7-60ecce65e2fb.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "山西汾酒 清香型 42度 500ml", description: "<p>杏花村正宗汾酒，清香纯正，入口柔和，适合日常饮用支持以物换物，品质保证。</p>",
    minPrice: 168, maxPrice: 168, salesCount: 479,
    rating: 4.3, reviewCount: 143, status: 'active',
    videoUrl: null, wantItems: "茶叶、零食",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 168, originalPrice: 280, stock: 340, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/27058d8b-dd2f-4211-be89-6753f320fded.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "泸州老窖特曲 52度 500ml*6瓶整箱", description: "<p>浓香型经典代表，国窖窖池酿造，商务宴请首选支持以物换物，品质保证。</p>",
    minPrice: 1280, maxPrice: 1280, salesCount: 271,
    rating: 4.8, reviewCount: 81, status: 'active',
    videoUrl: null, wantItems: "电子设备、办公家具",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 1280, originalPrice: 1980, stock: 506, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/2d6d72d5-6d98-489e-b01a-f6cc0432dec0.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "绍兴黄酒 陈年花雕 500ml*12瓶", description: "<p>绍兴原产，5年陈酿，适合料酒和日常饮用支持以物换物，品质保证。</p>",
    minPrice: 320, maxPrice: 320, salesCount: 111,
    rating: 3.5, reviewCount: 33, status: 'active',
    videoUrl: null, wantItems: "水果、农产品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 320, originalPrice: 520, stock: 338, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/1cfb6ba2-ee96-4568-88f2-8267faeff6be.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'],
    title: "东北五常大米 有机长粒香 25kg", description: "<p>五常核心产区，有机认证，颗粒饱满煮饭香糯</p><p>支持以物换物，品质保证。</p>",
    minPrice: 189, maxPrice: 298, salesCount: 116,
    rating: 3.9, reviewCount: 34, status: 'active',
    videoUrl: null, wantItems: "茶叶、日化用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 189, originalPrice: 298, stock: 335, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1584269903637-e1b1c717a2b4?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1644377949116-c4a6b529241c?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1633536706496-873ce0d46277?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'],
    title: "西班牙特级初榨橄榄油 1L*2瓶", description: "<p>西班牙原装进口，冷压初榨，酸度≤0.8%，烹饪健康油支持以物换物，品质保证。</p>",
    minPrice: 268, maxPrice: 268, salesCount: 399,
    rating: 3.6, reviewCount: 119, status: 'active',
    videoUrl: null, wantItems: "白酒、坚果",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 268, originalPrice: 420, stock: 279, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/0d237fee-6c9e-4ef3-ac3c-5b370d547c89.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'],
    title: "新疆若羌灰枣 一级 5kg装", description: "<p>新疆若羌原产，自然晾晒，肉厚核小，甜度高支持以物换物，品质保证。</p>",
    minPrice: 128, maxPrice: 128, salesCount: 477,
    rating: 4.6, reviewCount: 143, status: 'active',
    videoUrl: null, wantItems: "服装、日化",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 128, originalPrice: 218, stock: 138, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/1d196a43-0f17-4a59-926c-f19a29e565db.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'],
    title: "云南小粒咖啡豆 精品水洗 1kg", description: "<p>云南保山精品咖啡豆，水洗加工，中度烘焙，风味均衡支持以物换物，品质保证。</p>",
    minPrice: 158, maxPrice: 158, salesCount: 189,
    rating: 3.7, reviewCount: 56, status: 'active',
    videoUrl: null, wantItems: "茶叶、零食",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 158, originalPrice: 268, stock: 435, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['a59d6b4d-f530-493e-82aa-bb82b9c848cb'],
    title: "内蒙古风干牛肉干 原味 500g*3包", description: "<p>锡林郭勒草原黄牛肉，传统风干工艺，高蛋白零添加</p><p>支持以物换物，品质保证。</p>",
    minPrice: 218, maxPrice: 358, salesCount: 19,
    rating: 3.9, reviewCount: 5, status: 'active',
    videoUrl: null, wantItems: "水果、粮油",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 218, originalPrice: 358, stock: 349, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1551028150-64b9f398f678?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1646451403191-0d763de28fc2?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'],
    title: "商务男士纯棉长袖衬衫 100件起", description: "<p>精梳棉面料，免烫工艺，适合企业团购和经销商支持以物换物，品质保证。</p>",
    minPrice: 4500, maxPrice: 4500, salesCount: 41,
    rating: 4.2, reviewCount: 12, status: 'active',
    videoUrl: null, wantItems: "食品、日化用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 4500, originalPrice: 6800, stock: 72, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/845ce586-be9c-400b-8533-04ba8bf71921.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'],
    title: "女士真丝围巾 桑蚕丝 50条起", description: "<p>100%桑蚕丝，数码印花，轻薄透气，适合批量采购支持以物换物，品质保证。</p>",
    minPrice: 3800, maxPrice: 3800, salesCount: 270,
    rating: 3.5, reviewCount: 81, status: 'active',
    videoUrl: null, wantItems: "茶叶、美妆",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 3800, originalPrice: 5500, stock: 541, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1600166931532-604e927c794b?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'],
    title: "全棉工装T恤 定制印花 200件起", description: "<p>260g重磅棉，企业团体定制，质量稳定色牢度高支持以物换物，品质保证。</p>",
    minPrice: 5600, maxPrice: 5600, salesCount: 282,
    rating: 4.3, reviewCount: 84, status: 'active',
    videoUrl: null, wantItems: "电子产品、办公用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 5600, originalPrice: 8200, stock: 346, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/74b4c9e6-8cb8-4f76-b80a-d91622152af0.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'],
    title: "冬季加厚羽绒服 男女款 50件起", description: "<p>90%白鸭绒，充绒量180g，防风防水面料，库存尾货支持以物换物，品质保证。</p>",
    minPrice: 12500, maxPrice: 12500, salesCount: 306,
    rating: 4.1, reviewCount: 91, status: 'active',
    videoUrl: null, wantItems: "食品、建材",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 12500, originalPrice: 19800, stock: 390, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/30c48c2b-e564-48ba-9586-fe84337753bf.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['8ba1433f-45b0-4bdb-8bef-e3f8b4779a18'],
    title: "亚麻床品四件套 60支 100套起", description: "<p>法国亚麻原料，60支高支高密，透气吸湿支持以物换物，品质保证。</p>",
    minPrice: 18000, maxPrice: 18000, salesCount: 192,
    rating: 4.2, reviewCount: 57, status: 'active',
    videoUrl: null, wantItems: "电器、家具",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 18000, originalPrice: 28000, stock: 124, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/4a4826e9-5f35-4945-a73c-6b8f0fa4bc62.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['b7b9df60-a90d-4907-a724-16a9ac433543'],
    title: "蓝牙耳机 降噪TWS 500个起", description: "<p>主动降噪，蓝牙5.3，30小时续航，适合渠道分销</p><p>支持以物换物，品质保证。</p>",
    minPrice: 15000, maxPrice: 24500, salesCount: 73,
    rating: 3.9, reviewCount: 21, status: 'active',
    videoUrl: null, wantItems: "食品、酒水",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 15000, originalPrice: 24500, stock: 213, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1760410780969-07be31532d45?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1771707164892-57c8c6d015e6?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1771707164795-616362a69840?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['b7b9df60-a90d-4907-a724-16a9ac433543'],
    title: "智能手环 心率血氧 200个起", description: "<p>1.47英寸彩屏，心率血氧监测，14天续航，IP68防水支持以物换物，品质保证。</p>",
    minPrice: 8800, maxPrice: 8800, salesCount: 269,
    rating: 3.9, reviewCount: 80, status: 'active',
    videoUrl: null, wantItems: "茶叶、服装",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 8800, originalPrice: 14200, stock: 143, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/318ced0b-3c79-41ad-ab16-96850e79b136.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['b7b9df60-a90d-4907-a724-16a9ac433543'],
    title: "充电宝 20000mAh 300个起", description: "<p>20000mAh大容量，22.5W快充，LED数显，企业定制支持以物换物，品质保证。</p>",
    minPrice: 12000, maxPrice: 12000, salesCount: 224,
    rating: 4.8, reviewCount: 67, status: 'active',
    videoUrl: null, wantItems: "食品、日化",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 12000, originalPrice: 18900, stock: 475, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/029babb9-a751-43ef-aec0-66b35c5fd181.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['b7b9df60-a90d-4907-a724-16a9ac433543'],
    title: "LED护眼台灯 300台起", description: "<p>AA级照度，无频闪无蓝光，触控调光，USB充电口支持以物换物，品质保证。</p>",
    minPrice: 18000, maxPrice: 18000, salesCount: 33,
    rating: 4.4, reviewCount: 9, status: 'active',
    videoUrl: null, wantItems: "服装、家纺",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 18000, originalPrice: 28500, stock: 484, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/560338d7-d293-4b89-98a2-6b2502d60f48.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['608663a2-c19c-44e2-ba91-2fbe6d0467ff'], categoryId: catMap['b7b9df60-a90d-4907-a724-16a9ac433543'],
    title: "机械键盘 热插拔RGB 100个起", description: "<p>全键热插拔，PBT键帽，RGB灯效，多轴体可选支持以物换物，品质保证。</p>",
    minPrice: 9800, maxPrice: 9800, salesCount: 60,
    rating: 4.3, reviewCount: 18, status: 'active',
    videoUrl: null, wantItems: "食品、酒水",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 9800, originalPrice: 15800, stock: 109, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/bddbb761-7456-4164-a180-34b5742a76ca.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'],
    title: "氨基酸洗面奶 200ml 500支起", description: "<p>氨基酸表活，温和清洁，适合代理分销和企业福利支持以物换物，品质保证。</p>",
    minPrice: 7500, maxPrice: 7500, salesCount: 268,
    rating: 4.2, reviewCount: 80, status: 'active',
    videoUrl: null, wantItems: "食品、电子产品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 7500, originalPrice: 12000, stock: 50, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/15169159-2966-45b7-95d0-bbdf0519a250.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'],
    title: "保湿面膜 10片装 200盒起", description: "<p>玻尿酸精华液，补水保湿，蚕丝面膜材质支持以物换物，品质保证。</p>",
    minPrice: 6800, maxPrice: 6800, salesCount: 162,
    rating: 3.8, reviewCount: 48, status: 'active',
    videoUrl: null, wantItems: "茶叶、服装",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 6800, originalPrice: 10500, stock: 448, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/301f9339-5825-4fb2-aa5b-d5fbee5e8173.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'],
    title: "护手霜 50ml 1000支起", description: "<p>乳木果油配方，滋润不黏腻，适合企业礼品</p><p>支持以物换物，品质保证。</p>",
    minPrice: 5000, maxPrice: 8500, salesCount: 399,
    rating: 3.8, reviewCount: 119, status: 'active',
    videoUrl: null, wantItems: "食品、办公用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 5000, originalPrice: 8500, stock: 90, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1594527964562-32ed6eb11709?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1594332322527-08753d4473c1?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1697840526083-34c4367b79fa?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'],
    title: "男士洗发沐浴套装 300套起", description: "<p>无硅油洗发+氨基酸沐浴，旅行装套盒支持以物换物，品质保证。</p>",
    minPrice: 9000, maxPrice: 9000, salesCount: 217,
    rating: 4.4, reviewCount: 65, status: 'active',
    videoUrl: null, wantItems: "酒水、零食",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 9000, originalPrice: 14500, stock: 309, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/65b8a33e-c667-4053-a8ad-97cc4d18e8c1.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['3ca161c0-8733-4a60-bbf8-fe8139d20ac4'],
    title: "防晒喷雾 SPF50+ 150ml 500支起", description: "<p>物化结合防晒，清爽不黏腻，户外运动必备支持以物换物，品质保证。</p>",
    minPrice: 12500, maxPrice: 12500, salesCount: 401,
    rating: 3.9, reviewCount: 120, status: 'active',
    videoUrl: null, wantItems: "服装、电子",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 12500, originalPrice: 19500, stock: 239, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/56ba372e-3348-497f-804e-5d43c83e5c4c.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'],
    title: "智能扫地机器人 100台起", description: "<p>LDS激光导航，3000Pa吸力，自动集尘，APP控制支持以物换物，品质保证。</p>",
    minPrice: 45000, maxPrice: 45000, salesCount: 297,
    rating: 4.1, reviewCount: 89, status: 'active',
    videoUrl: null, wantItems: "食品、酒水",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 45000, originalPrice: 68000, stock: 535, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/dca20797-1b00-4df5-888e-c131f1a0724c.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'],
    title: "日式陶瓷餐具套装 16件套 200套起", description: "<p>高温釉下彩，安全无铅，微波炉可用支持以物换物，品质保证。</p>",
    minPrice: 12000, maxPrice: 12000, salesCount: 179,
    rating: 4.7, reviewCount: 53, status: 'active',
    videoUrl: null, wantItems: "服装、纺织品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 12000, originalPrice: 19800, stock: 130, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/ec6780b2-4e5e-447e-9e3f-fc13017a71dc.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'],
    title: "竹纤维毛巾 100条起", description: "<p>天然竹纤维，抗菌柔软，吸水性强支持以物换物，品质保证。</p>",
    minPrice: 2800, maxPrice: 2800, salesCount: 58,
    rating: 4.3, reviewCount: 17, status: 'active',
    videoUrl: null, wantItems: "食品、茶叶",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 2800, originalPrice: 4500, stock: 466, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/3142a7bd-0ed8-4cfa-9050-74bec102d0a5.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'],
    title: "实木办公桌 20张起", description: "<p>橡胶木实木，环保水性漆，适合办公室配置</p><p>支持以物换物，品质保证。</p>",
    minPrice: 18000, maxPrice: 28000, salesCount: 419,
    rating: 4.9, reviewCount: 125, status: 'active',
    videoUrl: null, wantItems: "电子产品、食品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 18000, originalPrice: 28000, stock: 137, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1679309981674-cef0e23a7864?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1604074131665-7a4b13870ab4?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['ff4e5eb9-6de0-44d7-af15-8034734b3058'],
    title: "LED筒灯 1000只起", description: "<p>嵌入式LED筒灯，3000K暖白光，高光效节能支持以物换物，品质保证。</p>",
    minPrice: 8000, maxPrice: 8000, salesCount: 111,
    rating: 4.9, reviewCount: 33, status: 'active',
    videoUrl: null, wantItems: "食品、日化",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 8000, originalPrice: 13500, stock: 355, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/02b399c1-46d2-48c1-a4c7-6405664fd8a6.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['dbbc22cf-0fe3-49dd-a7ce-c5fb775ab018'],
    title: "赣南脐橙 特级 20斤装 100箱起", description: "<p>赣南原产地直供，果大皮薄汁多，甜度高</p><p>支持以物换物，品质保证。</p>",
    minPrice: 8500, maxPrice: 13800, salesCount: 398,
    rating: 4.7, reviewCount: 119, status: 'active',
    videoUrl: null, wantItems: "白酒、日化用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 8500, originalPrice: 13800, stock: 310, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1543076659-9380cdf10613?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['dbbc22cf-0fe3-49dd-a7ce-c5fb775ab018'],
    title: "云南鲜花饼 玫瑰味 50盒起", description: "<p>新鲜食用玫瑰，酥皮层层分明，云南特产伴手礼支持以物换物，品质保证。</p>",
    minPrice: 3800, maxPrice: 3800, salesCount: 325,
    rating: 3.7, reviewCount: 97, status: 'active',
    videoUrl: null, wantItems: "茶叶、坚果",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 3800, originalPrice: 6200, stock: 84, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/9c7dc2d5-3362-42b9-912c-09c48a23ebac.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['dbbc22cf-0fe3-49dd-a7ce-c5fb775ab018'],
    title: "阳澄湖大闸蟹 礼券 100张起", description: "<p>阳澄湖原产，公4.0两母3.0两，4对装礼券支持以物换物，品质保证。</p>",
    minPrice: 28000, maxPrice: 28000, salesCount: 290,
    rating: 4.1, reviewCount: 87, status: 'active',
    videoUrl: null, wantItems: "白酒、电子产品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 28000, originalPrice: 42000, stock: 367, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/f97575d6-11eb-48c6-8875-07883c91ce5b.jpg", sortOrder: 0, type: 'main' }, { url: "/uploads/de66f6aa-ae4b-49fc-bf15-ada6657414df.jpg", sortOrder: 1, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['8fb5dbaf-39b5-493d-aa93-f9e69c924364'], categoryId: catMap['dbbc22cf-0fe3-49dd-a7ce-c5fb775ab018'],
    title: "新疆库尔勒香梨 10kg 50箱起", description: "<p>库尔勒原产，皮薄肉细，汁多味甜支持以物换物，品质保证。</p>",
    minPrice: 4500, maxPrice: 4500, salesCount: 425,
    rating: 4.4, reviewCount: 127, status: 'active',
    videoUrl: null, wantItems: "服装、日化",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 4500, originalPrice: 7200, stock: 295, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/606dc446-33b9-4897-83b5-605d00b926be.jpg", sortOrder: 0, type: 'main' }, { url: "/uploads/a542a254-9208-4cac-a433-480f90c79ad5.jpg", sortOrder: 1, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'],
    title: "一次性手套 丁腈材质 100箱起", description: "<p>医疗级丁腈手套，无粉设计，S/M/L码齐全</p><p>支持以物换物，品质保证。</p>",
    minPrice: 15000, maxPrice: 24000, salesCount: 212,
    rating: 4.8, reviewCount: 63, status: 'active',
    videoUrl: null, wantItems: "食品、办公用品",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 15000, originalPrice: 24000, stock: 316, image: null, status: 'active' }] },
    images: { create: [{ url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop", sortOrder: 0, type: 'main' }, { url: "https://images.unsplash.com/photo-1584819762556-68601d7f3a86?w=400&h=400&fit=crop", sortOrder: 1, type: 'main' }, { url: "https://images.unsplash.com/photo-1599412227383-b7d4751c8765?w=400&h=400&fit=crop", sortOrder: 2, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'],
    title: "包装纸箱 12号 1000个起", description: "<p>三层瓦楞纸，加厚加硬，快递电商通用支持以物换物，品质保证。</p>",
    minPrice: 3500, maxPrice: 3500, salesCount: 187,
    rating: 4.5, reviewCount: 56, status: 'active',
    videoUrl: null, wantItems: "食品、日化",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 3500, originalPrice: 5800, stock: 366, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/69f94427-5a8d-463d-aca3-23a856ba93a2.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'],
    title: "劳保工作服 夏季薄款 200套起", description: "<p>纯棉透气面料，反光条设计，企业定制logo支持以物换物，品质保证。</p>",
    minPrice: 8000, maxPrice: 8000, salesCount: 130,
    rating: 4.7, reviewCount: 39, status: 'active',
    videoUrl: null, wantItems: "食品、电子",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 8000, originalPrice: 12800, stock: 209, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/077db506-29e7-4549-83de-42e876621ee2.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'],
    title: "KN95口罩 独立包装 500盒起", description: "<p>五层过滤，独立包装，符合国标GB2626支持以物换物，品质保证。</p>",
    minPrice: 12000, maxPrice: 12000, salesCount: 349,
    rating: 5, reviewCount: 104, status: 'active',
    videoUrl: null, wantItems: "食品、酒水",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 12000, originalPrice: 19500, stock: 380, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/a0c9cc11-1dda-40c9-b7c6-d069fbe0fe51.png", sortOrder: 0, type: 'main' }, { url: "/uploads/7a35a1f5-bc9c-47ec-9735-775d59c39756.jpg", sortOrder: 1, type: 'detail' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['78a14bc4-006b-492a-b213-3c0c11b752d3'], categoryId: catMap['1cdbd59e-4388-418b-abcc-5eca2fb47ce3'],
    title: "办公打印纸 A4 70g 200箱起（管理员已审核）", description: "<p>双面打印不透底，500张/包，5包/箱支持以物换物，品质保证。</p>",
    minPrice: 7200, maxPrice: 7200, salesCount: 489,
    rating: 4.9, reviewCount: 146, status: 'active',
    videoUrl: null, wantItems: "食品、茶叶",
    skus: { create: [{ specs: {"默认":"标准款"}, price: 7200, originalPrice: 11000, stock: 111, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/7659b8bc-d217-4d23-a267-ad74fa9d0a0e.jpg", sortOrder: 0, type: 'main' }] },
  } });
  await prisma.product.create({ data: {
    shopId: shopMap['356124d6-dcf0-4423-8efc-6492e3ef7145'], categoryId: catMap['ef69becd-5f3d-4e55-bc30-c23f03f350ca'],
    title: "1", description: "1",
    minPrice: 5000, maxPrice: 5000, salesCount: 0,
    rating: 0, reviewCount: 0, status: 'active',
    videoUrl: null, wantItems: "美女",
    skus: { create: [{ specs: {"默认":"默认"}, price: 5000, originalPrice: 6000, stock: 1000, image: null, status: 'active' }] },
    images: { create: [{ url: "/uploads/de4e68db-276b-4f52-b4f0-bbea6d0418d0.jpg", sortOrder: 0, type: 'main' }] },
  } });

  console.log('Seed complete!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
