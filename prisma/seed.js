const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database seed status...');
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Skipping to preserve customer data.');
    return;
  }
  console.log('Seeding Wise Digital Garage Database...');


  // 2. Users with hashed passwords
  const passwordHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);
  const storeHash = await bcrypt.hash('store123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      fullName: 'Wise Digital Admin',
      role: 'ADMIN',
      phone: '0911001122',
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      passwordHash: managerHash,
      fullName: 'Ato Yohannes Girma',
      role: 'MANAGER',
      phone: '0911223344',
      status: 'ACTIVE',
    },
  });

  const mechanic1 = await prisma.user.create({
    data: {
      username: 'mechanic_daniel',
      passwordHash,
      fullName: 'Daniel Mekonnen (Lead Mechanic)',
      role: 'MECHANIC',
      phone: '0911334455',
      status: 'ACTIVE',
    },
  });

  const mechanic2 = await prisma.user.create({
    data: {
      username: 'mechanic_bekele',
      passwordHash,
      fullName: 'Bekele Tadesse (Auto Electrician)',
      role: 'MECHANIC',
      phone: '0911445566',
      status: 'ACTIVE',
    },
  });

  const storekeeper = await prisma.user.create({
    data: {
      username: 'storekeeper',
      passwordHash: storeHash,
      fullName: 'Almaz Tefera',
      role: 'STOREKEEPER',
      phone: '0911556677',
      status: 'ACTIVE',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      username: 'cashier',
      passwordHash: cashierHash,
      fullName: 'Selamawit Kebede',
      role: 'CASHIER',
      phone: '0911667788',
      status: 'ACTIVE',
    },
  });

  console.log('Created Users: Admin, Manager, Mechanics, Storekeeper, Cashier');

  // 3. Customers
  const customer1 = await prisma.customer.create({
    data: {
      customerType: 'INDIVIDUAL',
      name: 'Ato Adel Mergu',
      phone: '0911234567',
      tinNumber: '1027440012',
      vatNumber: '0003301934',
      address: 'Addis Ababa',
      kebele: '592',
      houseNo: '592',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerType: 'COMPANY',
      name: 'Lampros Trading',
      phone: '0911445566',
      tinNumber: '1099238411',
      address: 'Bole Subcity, Woreda 03',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerType: 'COMPANY',
      name: 'Aycheh Abeje (Con Mach Rental)',
      phone: '0911556677',
      tinNumber: '1088456123',
      address: 'Nifas Silk Lafto',
    },
  });

  const customerInsurance = await prisma.customer.create({
    data: {
      customerType: 'INSURANCE',
      name: 'Berhan Insurance S.C',
      phone: '011-465 15 53',
      tinNumber: '0003301934',
      vatNumber: '1027440012',
      address: 'Kirkos Subcity, Addis Ababa',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerType: 'INDIVIDUAL',
      name: 'W/ro Emebet Gashu Beyene',
      phone: '0911889900',
      address: 'Yeka Subcity',
    },
  });

  // 4. Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      customerId: customer1.id,
      plateNumber: '2-C83862',
      make: 'Toyota',
      model: 'Hilux Double Cabin',
      chassisNumber: 'MHF21TR458921',
      color: 'Silver',
      year: 2021,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      customerId: customer2.id,
      plateNumber: '2-C39114',
      make: 'Toyota',
      model: 'Land Cruiser Prado',
      chassisNumber: 'JTEBU29J001298',
      color: 'White',
      year: 2022,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      customerId: customer3.id,
      plateNumber: '3-822426',
      make: 'Isuzu',
      model: 'FSR Truck',
      chassisNumber: 'JALFSR34L70011',
      color: 'Blue',
      year: 2019,
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      customerId: customer4.id,
      plateNumber: '2-C72832',
      make: 'Hyundai',
      model: 'Tucson',
      chassisNumber: 'KMHJT81DBJU109',
      color: 'Grey',
      year: 2023,
    },
  });

  // 5. Inventory Parts
  const partsData = [
    { partNumber: '97139-06080', name: 'AC Air Cleaner Filter', category: 'AC System', quantity: 24, buyingPrice: 1200, sellingPrice: 1850, lowStockAlert: 5, unit: 'Pcs' },
    { partNumber: '99362-11260', name: 'AC Drive Belt', category: 'AC System', quantity: 18, buyingPrice: 450, sellingPrice: 750, lowStockAlert: 5, unit: 'Pcs' },
    { partNumber: '04495-60070', name: 'Rear Brake Shoe Set', category: 'Brake', quantity: 12, buyingPrice: 2400, sellingPrice: 3500, lowStockAlert: 4, unit: 'Set' },
    { partNumber: 'BP-1008', name: 'Front Brake Pad Heavy Duty', category: 'Brake', quantity: 30, buyingPrice: 1800, sellingPrice: 2800, lowStockAlert: 6, unit: 'Set' },
    { partNumber: 'HB-04495', name: 'Hand Brake Shoe Assembly', category: 'Brake', quantity: 3, buyingPrice: 1500, sellingPrice: 2200, lowStockAlert: 5, unit: 'Set' }, // Low stock alert!
    { partNumber: 'OIL-20W50', name: 'Total Rubia Engine Oil 20W50', category: 'Lubricants', quantity: 95, buyingPrice: 450, sellingPrice: 650, lowStockAlert: 20, unit: 'Lit' },
    { partNumber: 'FLT-0102', name: 'Toyota Genuine Oil Filter', category: 'Engine', quantity: 45, buyingPrice: 350, sellingPrice: 600, lowStockAlert: 10, unit: 'Pcs' },
    { partNumber: 'SPK-IRID', name: 'Denso Iridium Spark Plugs', category: 'Engine', quantity: 4, buyingPrice: 800, sellingPrice: 1200, lowStockAlert: 8, unit: 'Set' }, // Low stock alert!
    { partNumber: 'SHK-FR-01', name: 'Front Shock Absorber Gas Type', category: 'Suspension', quantity: 8, buyingPrice: 4500, sellingPrice: 6800, lowStockAlert: 4, unit: 'Pcs' },
  ];

  const createdParts = [];
  for (const p of partsData) {
    const cp = await prisma.inventoryPart.create({ data: p });
    createdParts.push(cp);
  }

  // 6. Services Catalog
  const servicesData = [
    { code: 'SVC-FND-01', name: 'LHS Fender [Strip & Rebuild]', category: 'Body & Painting', basePrice: 3000, description: 'Disassembly, dent removal, alignment, preparation and repaint' },
    { code: 'SVC-BMP-01', name: 'FR Bumper [Strip & Rebuild]', category: 'Body & Painting', basePrice: 4500, description: 'Front bumper cover strip, plastic weld and high-gloss refinish' },
    { code: 'SVC-RCK-01', name: 'Rocker Panel RR LHS Light Garnish [Straightening & Painting]', category: 'Body & Painting', basePrice: 3500, description: 'Rocker panel repair and paint match' },
    { code: 'SVC-BRK-01', name: 'Full Brake System Overhaul & Bleeding', category: 'Brake', basePrice: 2800, description: 'Inspection, shoe/pad change, cylinder check and fluid flush' },
    { code: 'SVC-ENG-01', name: 'Minor Engine Tune-up & Oil Change', category: 'Engine', basePrice: 1500, description: 'Oil & filter change, spark inspection, throttle body clean' },
    { code: 'SVC-SUSP-01', name: 'Suspension Bushing & Arm Replacement', category: 'Suspension', basePrice: 3200, description: 'Suspension diagnosis and arm bushing press replacement' },
  ];

  for (const s of servicesData) {
    await prisma.servicesCatalog.create({ data: s });
  }

  // 7. Completed/Terminated Job Card with Invoice (Reference Photo 1 & 2: SY_1618)
  const jobCard1 = await prisma.jobCard.create({
    data: {
      cardNumber: 'SY_1618',
      customerId: customer1.id,
      vehicleId: vehicle1.id,
      mechanicId: mechanic1.id,
      odoMeter: 145200,
      fuelLevel: '1/2',
      conditionNotes: 'Small scratch on front right wing. Spare tire and tools verified.',
      pricingOption: 'SEPARATE',
      status: 'TERMINATED',
      paymentStatus: 'PAID',
      entryDate: new Date('2026-11-16T09:00:00Z'),
      closedDate: new Date('2026-11-18T16:30:00Z'),
      labourSubtotal: 3000.0,
      partsSubtotal: 0.0,
      subTotal: 3000.0,
      vatAmount: 450.0,
      fuelLubricants: 0.0,
      grandTotal: 3450.0,
    },
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: jobCard1.id,
      description: 'Estimation for labour cost - LHS Fender [Strip & Rebuild]',
      category: 'Body & Painting',
      cost: 3000.0,
      status: 'COMPLETED',
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-1001',
      fsNumber: '00000319',
      jobCardId: jobCard1.id,
      customerId: customer1.id,
      vehicleId: vehicle1.id,
      date: new Date('2026-11-18T16:30:00Z'),
      labourTotal: 3000.0,
      partsTotal: 0.0,
      subTotal: 3000.0,
      vatAmount: 450.0,
      fuelLubricants: 0.0,
      grandTotal: 3450.0,
      paymentMethod: 'CASH',
      status: 'PAID',
    },
  });

  // 8. Other Job Cards from Photo 2
  await prisma.jobCard.create({
    data: {
      cardNumber: 'SY_1617',
      customerId: customer2.id,
      vehicleId: vehicle2.id,
      mechanicId: mechanic2.id,
      odoMeter: 68500,
      fuelLevel: '3/4',
      status: 'TERMINATED',
      paymentStatus: 'PAID',
      entryDate: new Date('2026-11-16T10:30:00Z'),
      closedDate: new Date('2026-11-17T17:00:00Z'),
      labourSubtotal: 4500.0,
      partsSubtotal: 2600.0,
      subTotal: 7100.0,
      vatAmount: 1065.0,
      grandTotal: 8165.0,
    },
  });

  await prisma.jobCard.create({
    data: {
      cardNumber: 'SY_1616',
      customerId: customer3.id,
      vehicleId: vehicle3.id,
      mechanicId: mechanic1.id,
      odoMeter: 210400,
      fuelLevel: '1/4',
      status: 'TERMINATED',
      paymentStatus: 'UNPAID',
      entryDate: new Date('2026-11-11T08:00:00Z'),
      closedDate: new Date('2026-11-15T14:00:00Z'),
      labourSubtotal: 8500.0,
      partsSubtotal: 6200.0,
      subTotal: 14700.0,
      vatAmount: 2205.0,
      grandTotal: 16905.0,
    },
  });

  // 9. Active Job Cards
  const activeJob1 = await prisma.jobCard.create({
    data: {
      cardNumber: 'SY_1619',
      customerId: customer4.id,
      vehicleId: vehicle4.id,
      mechanicId: mechanic2.id,
      odoMeter: 32000,
      fuelLevel: 'F',
      conditionNotes: 'Left mirror case loose, clean interior.',
      pricingOption: 'SEPARATE',
      status: 'ACTIVE',
      paymentStatus: 'UNPAID',
      entryDate: new Date('2026-11-18T08:30:00Z'),
      labourSubtotal: 2800.0,
      partsSubtotal: 3500.0,
      subTotal: 6300.0,
      vatAmount: 945.0,
      grandTotal: 7245.0,
    },
  });

  await prisma.jobCardService.create({
    data: {
      jobCardId: activeJob1.id,
      description: 'Full Brake System Overhaul & Bleeding',
      category: 'Brake',
      cost: 2800.0,
      status: 'IN_PROGRESS',
    },
  });

  await prisma.jobCardPart.create({
    data: {
      jobCardId: activeJob1.id,
      partId: createdParts[2].id, // Rear Brake Shoe Set
      partName: 'Rear Brake Shoe Set 04495-60070',
      partNumber: '04495-60070',
      category: 'Brake',
      quantity: 1,
      unitPrice: 3500.0,
      totalPrice: 3500.0,
    },
  });

  // 10. Proforma (Reference Photo 10: PRF-38696 with Berhan Insurance)
  const proforma1 = await prisma.proforma.create({
    data: {
      proformaNumber: 'PRF-38696',
      customerId: customerInsurance.id,
      vehicleId: vehicle1.id,
      insuranceCompany: 'Berhan Insurance S.C',
      claimNumber: '2-B22222',
      surveyorName: 'Ato Dawit Tilahun',
      status: 'ACTIVE',
      validUntil: new Date('2026-12-18T00:00:00Z'),
      labourSubtotal: 45000.0,
      partsSubtotal: 0.0,
      subTotal: 45000.0,
      vatAmount: 6750.0,
      fuelLubricants: 0.0,
      grandTotal: 51750.0,
      notes: 'As Per The Lists Indicate In Insurance Survey Report',
    },
  });

  await prisma.proformaItem.create({
    data: {
      proformaId: proforma1.id,
      itemType: 'REPAIR',
      description: 'LHS Fender [Strip & Rebuild]',
      unit: 'Pcs',
      quantity: 1,
      unitPrice: 45000.0,
      totalPrice: 45000.0,
    },
  });

  await prisma.proformaItem.create({
    data: {
      proformaId: proforma1.id,
      itemType: 'REPAIR',
      description: 'FR Bumper [Strip & Rebuild]',
      unit: 'Pcs',
      quantity: 1,
      unitPrice: 0.0,
      totalPrice: 0.0,
    },
  });

  // Customer Credit
  await prisma.customerCredit.create({
    data: {
      customerId: customer3.id,
      totalCredit: 16905.0,
      paidAmount: 5000.0,
      remainingDue: 11905.0,
      lastPaymentAt: new Date('2026-11-15T15:00:00Z'),
      notes: 'Initial deposit paid, remaining on 30-day corporate invoice terms',
    },
  });

  // Initial Audit Log
  await prisma.auditLog.create({
    data: {
      username: 'admin',
      action: 'SYSTEM_SEED',
      entity: 'DATABASE',
      details: 'Initial system seeding with realistic AGMS baseline data',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
