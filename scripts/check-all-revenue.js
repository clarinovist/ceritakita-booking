const Database = require('better-sqlite3');
const path = require('path');

// Open database
const dbPath = path.join(__dirname, '..', 'data', 'bookings.db');
const db = new Database(dbPath, { readonly: true });

// Format currency in IDR
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

console.log('='.repeat(80));
console.log('LAPORAN PENDAPATAN KESELURUHAN - CERITAKITA BOOKING');
console.log('='.repeat(80));
console.log();

// Get all bookings
const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();

if (bookings.length === 0) {
  console.log('Tidak ada transaksi dalam database.');
  db.close();
  process.exit(0);
}

console.log(`Total Seluruh Booking: ${bookings.length} transaksi\n`);

// Get date range
const dates = bookings.map(b => new Date(b.created_at));
const oldestDate = new Date(Math.min(...dates));
const newestDate = new Date(Math.max(...dates));

console.log(`Periode Data: ${oldestDate.toLocaleDateString('id-ID')} - ${newestDate.toLocaleDateString('id-ID')}\n`);

// Calculate total revenue and payments
let totalRevenue = 0;
let totalPaid = 0;
let totalOutstanding = 0;
const revenueByCategory = {};
const revenueByMonth = {};
const bookingsByStatus = {
  'Active': { count: 0, revenue: 0, paid: 0 },
  'Completed': { count: 0, revenue: 0, paid: 0 },
  'Cancelled': { count: 0, revenue: 0, paid: 0 },
  'Rescheduled': { count: 0, revenue: 0, paid: 0 }
};

bookings.forEach(booking => {
  const bookingId = booking.id;

  // Get payments for this booking
  const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ?').all(bookingId);

  const totalPrice = booking.total_price || 0;
  const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstanding = totalPrice - paidAmount;

  totalRevenue += totalPrice;
  totalPaid += paidAmount;
  totalOutstanding += outstanding;

  // Group by category
  const category = booking.customer_category || 'Lainnya';
  if (!revenueByCategory[category]) {
    revenueByCategory[category] = {
      count: 0,
      revenue: 0,
      paid: 0,
      outstanding: 0
    };
  }
  revenueByCategory[category].count++;
  revenueByCategory[category].revenue += totalPrice;
  revenueByCategory[category].paid += paidAmount;
  revenueByCategory[category].outstanding += outstanding;

  // Group by month
  const bookingDate = new Date(booking.created_at);
  const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = bookingDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  if (!revenueByMonth[monthKey]) {
    revenueByMonth[monthKey] = {
      label: monthLabel,
      count: 0,
      revenue: 0,
      paid: 0,
      outstanding: 0
    };
  }
  revenueByMonth[monthKey].count++;
  revenueByMonth[monthKey].revenue += totalPrice;
  revenueByMonth[monthKey].paid += paidAmount;
  revenueByMonth[monthKey].outstanding += outstanding;

  // Group by status
  const status = booking.status || 'Active';
  if (bookingsByStatus[status]) {
    bookingsByStatus[status].count++;
    bookingsByStatus[status].revenue += totalPrice;
    bookingsByStatus[status].paid += paidAmount;
  }
});

console.log('📊 RINGKASAN TOTAL PENDAPATAN');
console.log('-'.repeat(80));
console.log(`Total Pendapatan (Revenue):        ${formatIDR(totalRevenue)}`);
console.log(`Total Sudah Dibayar:               ${formatIDR(totalPaid)}`);
console.log(`Total Belum Dibayar (Outstanding): ${formatIDR(totalOutstanding)}`);
console.log(`Persentase Terbayar:               ${totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(2) : 0}%`);
console.log();

console.log('📅 PENDAPATAN PER BULAN');
console.log('-'.repeat(80));
console.log('Bulan'.padEnd(20), 'Booking'.padEnd(10), 'Revenue'.padEnd(20), 'Terbayar'.padEnd(20), 'Outstanding');
console.log('-'.repeat(80));

Object.entries(revenueByMonth)
  .sort((a, b) => b[0].localeCompare(a[0])) // Sort by month descending
  .forEach(([key, data]) => {
    console.log(
      data.label.padEnd(20),
      data.count.toString().padEnd(10),
      formatIDR(data.revenue).padEnd(20),
      formatIDR(data.paid).padEnd(20),
      formatIDR(data.outstanding)
    );
  });

console.log();
console.log('📈 PENDAPATAN PER KATEGORI LAYANAN');
console.log('-'.repeat(80));
console.log('Kategori'.padEnd(25), 'Booking'.padEnd(10), 'Revenue'.padEnd(20), 'Terbayar'.padEnd(20), 'Outstanding');
console.log('-'.repeat(80));

Object.entries(revenueByCategory)
  .sort((a, b) => b[1].revenue - a[1].revenue)
  .forEach(([category, data]) => {
    console.log(
      category.padEnd(25),
      data.count.toString().padEnd(10),
      formatIDR(data.revenue).padEnd(20),
      formatIDR(data.paid).padEnd(20),
      formatIDR(data.outstanding)
    );
  });

console.log();
console.log('📋 PENDAPATAN PER STATUS BOOKING');
console.log('-'.repeat(80));
console.log('Status'.padEnd(15), 'Booking'.padEnd(10), 'Revenue'.padEnd(20), 'Terbayar');
console.log('-'.repeat(80));

Object.entries(bookingsByStatus)
  .filter(([_, data]) => data.count > 0)
  .sort((a, b) => b[1].revenue - a[1].revenue)
  .forEach(([status, data]) => {
    console.log(
      status.padEnd(15),
      data.count.toString().padEnd(10),
      formatIDR(data.revenue).padEnd(20),
      formatIDR(data.paid)
    );
  });

console.log();
console.log('💰 10 TRANSAKSI TERBESAR');
console.log('-'.repeat(80));
console.log('ID'.padEnd(10), 'Customer'.padEnd(25), 'Kategori'.padEnd(20), 'Total'.padEnd(15), 'Status');
console.log('-'.repeat(80));

const topBookings = bookings
  .sort((a, b) => (b.total_price || 0) - (a.total_price || 0))
  .slice(0, 10);

topBookings.forEach(booking => {
  console.log(
    booking.id.substring(0, 8).padEnd(10),
    booking.customer_name.substring(0, 23).padEnd(25),
    (booking.customer_category || '').substring(0, 18).padEnd(20),
    formatIDR(booking.total_price).padEnd(15),
    booking.status
  );
});

console.log();
console.log('⚠️  TRANSAKSI DENGAN OUTSTANDING > Rp 0');
console.log('-'.repeat(80));

const unpaidBookings = bookings
  .map(booking => {
    const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ?').all(booking.id);
    const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstanding = (booking.total_price || 0) - paidAmount;
    return { ...booking, paidAmount, outstanding };
  })
  .filter(b => b.outstanding > 0 && b.status !== 'Cancelled')
  .sort((a, b) => b.outstanding - a.outstanding);

if (unpaidBookings.length > 0) {
  console.log('Customer'.padEnd(25), 'Total'.padEnd(15), 'Terbayar'.padEnd(15), 'Sisa'.padEnd(15), 'Status');
  console.log('-'.repeat(80));

  unpaidBookings.forEach(booking => {
    console.log(
      booking.customer_name.substring(0, 23).padEnd(25),
      formatIDR(booking.total_price).padEnd(15),
      formatIDR(booking.paidAmount).padEnd(15),
      formatIDR(booking.outstanding).padEnd(15),
      booking.status
    );
  });

  const totalUnpaid = unpaidBookings.reduce((sum, b) => sum + b.outstanding, 0);
  console.log('-'.repeat(80));
  console.log(`Total Outstanding: ${formatIDR(totalUnpaid)} dari ${unpaidBookings.length} booking`);
} else {
  console.log('Tidak ada transaksi dengan outstanding.');
}

console.log();
console.log('='.repeat(80));
console.log('Laporan dibuat pada:', new Date().toLocaleString('id-ID'));
console.log('='.repeat(80));

db.close();
