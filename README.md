# Wise Digital Garage Management System (የጋራጅ ማኔጅመንት ሲስተም)

A complete, production-ready Garage Management and Estimation System built with **Next.js 14**, **Bootstrap 5**, **Chart.js**, **Prisma ORM**, and **PostgreSQL/SQLite**.

Based on the official **AGMS (Abegaz Motors Engineering)** system specifications and workflows.

---

## 🚀 ፈጣን ማስጀመሪያ (Quick Start)

### 1. ፕሮጀክቱን ማስኬድ (Run Development Server)
ፕሮጀክቱ በSQLite ዳታቤዝ ተዘጋጅቶ በውስጡ የሞከራ መረጃዎች (Seed Data) ተካተውበታል፦

```bash
# 1. የዳታቤዝ ክላይንት ማመንጨት (Generate Prisma Client)
npm run prisma:generate

# 2. የሞከራ ዳታ መጫን (Seed Initial Garage Data)
node prisma/seed.js

# 3. ሰርቨሩን ማስጀመር (Start Development Server)
npm run dev
```

አሳሽዎን (Browser) ከፍተው **`http://localhost:3000`** ይግቡ።

---

## 👥 የመግቢያ መለያዎች (Demo Staff Credentials)

በመግቢያ ገጹ (`/login`) ላይ በ**Quick Demo Buttons** ወይም በሚከተሉት መለያዎች መግባት ይችላሉ፦

| የስራ ድርሻ (Role) | የተጠቃሚ ስም (Username) | የይለፍ ቃል (Password) | ፈቃድና ስልጣን (Permissions) |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | ሙሉ የሲስተም ቁጥጥር፣ ተጠቃሚዎች እና ባካፕ |
| **Manager** | `manager` | `manager123` | ካርዶች ማጽደቅ፣ ፕሮፎርማ መቀየር፣ ሪፖርቶች |
| **Cashier** | `cashier` | `cashier123` | ደረሰኝ ማውጣት (FS No)፣ ክፍያ እና ዱቤ መመዝገብ |
| **Storekeeper** | `storekeeper` | `store123` | የስቶር እቃ መጨመር፣ የStock In/Out ቁጥጥር |
| **Lead Mechanic** | `mechanic_daniel` | `admin123` | የስራ ካርዶችን እና የጥገና ዝርዝሮችን ማየት |

---

## 🛠 ዋና ዋና ገጾች እና አሰራሮች (Core Modules)

### 1. Dashboard (ዋና መቆጣጠሪያ - ፎቶ 6)
- **4 Summary Cards**: Active Job Cards, Terminated Cards, Proformas, Total Vehicles, Total Revenue.
- **Job Card Timeline Chart (Chart.js)**: በየወሩ የገቡ መኪኖች ፍሰት ግራፍ።
- **Low Stock Alerts**: ከስቶር ሊያልቁ የተቃረቡ እቃዎች ማስጠንቀቂያ።

### 2. Customer Service (ደንበኞች እና ተሽከርካሪዎች - ፎቶ 7)
- በስም፣ ስልክ ቁጥር፣ ታርጋ ቁጥር ወይም በTIN ቁጥር ፈጣን ፍለጋ።
- `+ New Customer / Job Card` እና `+ New Customer / Terminated Job Card` አዝራሮች።
- ደንበኛና መኪና በአንድ ቅጽ የሚመዘገብበት ፈጣን Popup Modal።

### 3. Job Card Management (የስራ ካርድ ክትትል - ፎቶ 2, 3, 4, 5)
- **Active Cards & Terminated Cards Table**: Search, Copy, CSV, Print, Pagination DataTables።
- **New Job Card 3 Tabs**:
  1. *Conditions*: የመኪናው ኪሎሜትር (Odometer)፣ ነዳጅ፣ ጭረቶችና ዕቃዎች ቼክሊስት።
  2. *Services*: የጥገና ስራዎች ከተጠቃለለ ወይም ከተናጠል የእጅ ዋጋ (Labour Cost) ጋር።
  3. *Part Requisitions*: ከመጋዘን የሚወጡ መለዋወጫዎች ምርጫ፣ ብዛት እና ዋጋ (ከስቶር በራሱ የሚቀንስ)።
- **Pricing Options**: Separate pricing vs Aggregate pricing።

### 4. Proforma Management (የዋጋ ግምት - ፎቶ 8, 9, 10)
- ለኢንሹራንስ ኩባንያዎች እና ድርጅቶች ክሌም ቁጥር (Claim No) እና ሰርቬየር (Surveyor) መመዝገቢያ።
- Repair (የሚጠገኑ) እና Replace (የሚቀየሩ) እቃዎች ሰንጠረዥ።
- **One-Click Convert**: ፕሮፎርማውን ወደ Job Card በአንድ ክሊክ የመቀየር አውቶሜሽን።

### 5. Printable A4 Templates (ህጋዊ የህትመት ገጾች - ፎቶ 1 እና 10)
- **Attachment Cash Invoice (`Photo 1`)**: FS Number፣ የጋራዡና ደንበኛው TIN/VAT፣ የእጅ ዋጋ ድምር፣ የእቃ ድምር፣ 15% VAT እና ጠቅላላ ድምር ያለው A4 ህትመት።
- **Proforma Print Layout (`Photo 10`)**: የWise Digital Garage አርማ፣ TIN፣ የኢንሹራንስ መረጃ እና የተሟላ የሂሳብ ስሌት የያዘ ንጹህ A4 ፕሪንት።

### 6. Inventory & Store Management
- የመለዋወጫ እቃዎች ዝርዝር (Part Number, Name, Category, Quantity, Buying Price, Selling Price)።
- እቃ ወደ ካርድ ሲወጣ በራሱ ከስቶር የሚቀንስበት (Auto Stock Deduction)።
- አዲስ እቃ መመዝገቢያ እና ያለቁ እቃዎች ማጣሪያ።

### 7. Customer Credits (የዱቤ ክትትል)
- በዱቤ የወሰዱ ደንበኞች ቀሪ ሂሳብ፣ የተከፈለ መጠን፣ እና የክፍያ ታሪክ መመዝገቢያ።

### 8. Reports & Security
- የገቢ ሪፖርት (Labour vs Parts vs 15% VAT) ወደ CSV እና Print መላኪያ።
- የመካኒኮች የስራ አፈጻጸም ሪፖርት (Mechanic Performance)።
- ማን ምን እንደቀየረ የሚያሳይ የማያፈናፍን መዝገብ (Audit Logs)።
- አውቶማቲክ የዳታቤዝ ባካፕ (`/api/backup`)።

---

## 🗄️ ወደ PostgreSQL መቀየር ሲፈልጉ (Switching to PostgreSQL)

ወደ PostgreSQL ለመቀየር በ `prisma/schema.prisma` ውስጥ ያለውን `provider` እና በ `.env` ውስጥ ያለውን `DATABASE_URL` ብቻ ይቀይሩ፦

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

በ `.env` ውስጥ:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wise_garage_db?schema=public"
```

ከዚያ:
```bash
npx prisma db push
node prisma/seed.js
```
