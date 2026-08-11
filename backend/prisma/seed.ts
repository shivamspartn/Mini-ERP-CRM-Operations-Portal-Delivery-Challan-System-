import { PrismaClient, UserRole, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing tables (in strict order of relation dependencies)
  console.log('🧹 Cleaning existing database tables...');
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  console.log('✨ Cleaned existing database tables.');

  // 2. Hash Default Password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Seed Users (All 4 RBAC Roles using UserRole)
  console.log('👤 Seeding system users...');
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@minierp.com',
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Sales',
      email: 'sales@minierp.com',
      password: passwordHash,
      role: UserRole.SALES,
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Wayne Warehouse',
      email: 'warehouse@minierp.com',
      password: passwordHash,
      role: UserRole.WAREHOUSE,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Alice Accounts',
      email: 'accounts@minierp.com',
      password: passwordHash,
      role: UserRole.ACCOUNTS,
    },
  });
  console.log('👥 4 Users created across ADMIN, SALES, WAREHOUSE, and ACCOUNTS roles.');

  // 4. Seed CRM Customers
  console.log('🏢 Seeding CRM customer directory...');
  const customer1 = await prisma.customer.create({
    data: {
      customerName: 'Rajesh Sharma',
      mobileNumber: '+91 9876543210',
      email: 'rajesh@apexretail.com',
      businessName: 'Apex Retailers',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: CustomerType.WHOLESALE,
      address: '102 Commercial Street',
      city: 'Mumbai',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date('2026-08-15'),
      notes: 'Key wholesale customer for West region.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerName: 'Ananya Gupta',
      mobileNumber: '+91 9123456789',
      email: 'ananya@guptagroup.com',
      businessName: 'Gupta Enterprises',
      gstNumber: '27BBBBB1111B2Z6',
      customerType: CustomerType.DISTRIBUTOR,
      address: '45 Industrial Area, Sector 62',
      city: 'Noida',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Inquired about hardware distribution pricing.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerName: 'TechSolutions Lead',
      mobileNumber: '+1 555-0188',
      email: 'info@techsolutions.com',
      businessName: 'TechSolutions Pvt',
      customerType: CustomerType.RETAIL,
      address: '12 Innovation Way',
      city: 'Austin',
      status: CustomerStatus.LEAD,
      notes: 'Interested in bulk IT monitors.',
    },
  });

  console.log('🏢 Customers created.');

  // 5. Seed Follow-ups
  console.log('📞 Seeding sales follow-up notes...');
  await prisma.followUp.create({
    data: {
      customerId: customer1.id,
      notes: 'Discussed Q3 pricing tiers. Sent updated catalog.',
      createdBy: salesUser.id,
    },
  });

  // 6. Seed Products (Inventory Catalog)
  console.log('📦 Seeding inventory catalog items...');
  const prod1 = await prisma.product.create({
    data: {
      productName: 'Ergonomic Office Chair',
      sku: 'FURN-001',
      category: 'Furniture',
      unitPrice: 7499.00,
      currentStock: 25,
      minimumStock: 5,
      warehouseLocation: 'Bin-A1',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      productName: 'Wireless Mechanical Keyboard',
      sku: 'TECH-101',
      category: 'Electronics',
      unitPrice: 3200.00,
      currentStock: 4, // Trigger Low Stock alert
      minimumStock: 10,
      warehouseLocation: 'Bin-B3',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      productName: 'UltraWide Monitor 27"',
      sku: 'TECH-202',
      category: 'Electronics',
      unitPrice: 18500.00,
      currentStock: 12,
      minimumStock: 3,
      warehouseLocation: 'Bin-C2',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      productName: 'Industrial Barcode Scanner X1',
      sku: 'SKU-SCAN-001',
      category: 'Hardware',
      unitPrice: 12500.00,
      currentStock: 50,
      minimumStock: 10,
      warehouseLocation: 'Shelf A-12',
    },
  });

  console.log('📦 Products created.');

  // 7. Seed Stock Movements
  console.log('⚡ Seeding initial stock movements...');
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantity: 25,
        movementType: MovementType.IN,
        reason: 'Initial Vendor Restock Batch #101',
        createdBy: warehouseUser.id,
      },
      {
        productId: prod2.id,
        quantity: 10,
        movementType: MovementType.IN,
        reason: 'Initial stock intake from supplier',
        createdBy: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantity: 12,
        movementType: MovementType.IN,
        reason: 'Initial stock intake',
        createdBy: warehouseUser.id,
      },
      {
        productId: prod4.id,
        quantity: 50,
        movementType: MovementType.IN,
        reason: 'Bulk purchase order intake',
        createdBy: warehouseUser.id,
      },
    ],
  });

  console.log('📊 Stock movements recorded.');

  // 8. Seed Delivery Challans
  console.log('📄 Seeding delivery challans...');
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'DC-2026-0001',
      customerId: customer1.id,
      totalQuantity: 2,
      status: ChallanStatus.CONFIRMED,
      createdBy: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            productNameSnapshot: prod1.productName,
            skuSnapshot: prod1.sku,
            unitPriceSnapshot: prod1.unitPrice,
            quantity: 2,
            subtotal: 14998.00,
          },
        ],
      },
    },
  });

  const challan2 = await prisma.challan.create({
    data: {
      challanNumber: 'DC-2026-0002',
      customerId: customer2.id,
      totalQuantity: 3,
      status: ChallanStatus.DRAFT,
      createdBy: salesUser.id,
      items: {
        create: [
          {
            productId: prod2.id,
            productNameSnapshot: prod2.productName,
            skuSnapshot: prod2.sku,
            unitPriceSnapshot: prod2.unitPrice,
            quantity: 3,
            subtotal: 9600.00,
          },
        ],
      },
    },
  });

  console.log(`📄 Challans created (${challan1.challanNumber}, ${challan2.challanNumber}).`);

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });