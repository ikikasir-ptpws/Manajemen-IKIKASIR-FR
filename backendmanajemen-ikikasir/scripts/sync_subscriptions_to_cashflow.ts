import { prisma } from '../src/infrastructure/database/prisma.js';

async function syncSubscriptionsToCashflow() {
  console.log('🔄 Memulai sinkronisasi riwayat langganan pelanggan ke tabel CashTransaction...');

  const histories = await prisma.subscriptionHistory.findMany({
    include: {
      customer: true,
      package: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Ditemukan ${histories.length} riwayat langganan.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const hist of histories) {
    if (hist.paymentStatus !== 'PAID' || hist.amount <= 0) {
      skippedCount++;
      continue;
    }

    const dateObj = hist.startedAt || hist.createdAt || new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const rawDate = `${year}-${month}-${day}`;

    const clientLabel = hist.customer?.businessName
      ? `${hist.customer.businessName} (${hist.customer.name})`
      : (hist.customer?.name || 'Pelanggan');

    const shortId = hist.id.substring(0, 8).toUpperCase();
    const invoiceNo = `INV-${rawDate.replace(/-/g, '')}-SYNC-${shortId}`;

    // Cek apakah transaksi riwayat ini sudah tercatat di cash_transactions
    const existingTx = await prisma.cashTransaction.findFirst({
      where: {
        invoiceNo,
      },
    });

    if (existingTx) {
      console.log(`⏩ Lewati: Transaksi untuk ${clientLabel} (${invoiceNo}) sudah ada di Arus Kas.`);
      skippedCount++;
      continue;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const displayDate = `${day} ${months[dateObj.getMonth()] || ''} ${year}`;
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const mins = String(dateObj.getMinutes()).padStart(2, '0');
    const time = `${hours}:${mins} WIB`;

    await prisma.cashTransaction.create({
      data: {
        type: 'masuk',
        category: 'Lisensi POS',
        desc: `Pembayaran Langganan - ${clientLabel} (${hist.packageName || 'Basic'})`,
        amount: hist.amount,
        date: dateObj,
        rawDate,
        displayDate,
        time,
        customer: clientLabel,
        paymentMethod: hist.paymentMethod || 'QRIS',
        paymentProofUrl: hist.paymentProofUrl || '',
        status: 'Selesai',
        invoiceNo,
        notes: hist.notes || `Sinkronisasi riwayat langganan paket ${hist.packageName}`,
      },
    });

    console.log(`✅ Berhasil mencatat ke Arus Kas: ${clientLabel} - Rp ${hist.amount} (${rawDate})`);
    createdCount++;
  }

  console.log(`\n🎉 Selesai! Ditambahkan: ${createdCount}, Dilewati: ${skippedCount}`);
}

syncSubscriptionsToCashflow()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
