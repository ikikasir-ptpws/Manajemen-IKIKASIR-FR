import { Box, Crown } from "lucide-vue-next";
import { computed, onMounted, ref, type Component } from "vue";
import { packagesApi, type PackageItem } from "../api";

/**
 * Model kartu paket untuk landing page.
 * Seluruh field berasal dari API `GET /api/packages`,
 * kecuali properti visual (kelas kartu, tombol, badge) yang diturunkan di frontend.
 */
export interface LandingPackageCard {
  id: string;
  name: string;
  cardSub: string;
  isConsultation: boolean;
  isHighlighted: boolean;
  price: number;
  period: string;
  features: string[];
  badge?: string;
  cardClass: string;
  btnClass: string;
  btnText: string;
  priceTitle?: string;
  priceSubtext?: string;
  icon: Component;
}

/** Nomor WhatsApp IKI KASIR untuk tombol "Hubungi Kami" */
export const IKIKASIR_WA_NUMBER = "628132538603";

/**
 * Membuat link WhatsApp menuju nomor IKI KASIR.
 * @param message pesan bawaan (opsional)
 */
export function getIkiKasirWaUrl(message?: string) {
  const text =
    message ??
    "Halo tim IKI KASIR, saya ingin menanyakan paket langganan untuk bisnis saya.";
  return `https://wa.me/${IKIKASIR_WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getPaketWaUrl(packageName?: string) {
  const text = packageName
    ? `Halo tim IKI KASIR, saya ingin konsultasi mengenai paket ${packageName}.`
    : "Halo tim IKI KASIR, saya ingin konsultasi mengenai paket langganan.";
  return getIkiKasirWaUrl(text);
}

function mapPackageToCard(p: PackageItem, isFeatured: boolean): LandingPackageCard {
  const isConsultation = Boolean(p.isConsultation);
  const isHighlighted = isConsultation || isFeatured;

  return {
    id: p.id,
    name: p.name,
    cardSub: p.description || "",
    isConsultation,
    isHighlighted,
    price: p.price ?? 0,
    period: p.period || "/bulan",
    features: Array.isArray(p.features) ? p.features : [],
    badge: isFeatured ? "Populer" : undefined,
    cardClass: [
      "price-card",
      isConsultation ? "consultation" : isFeatured ? "pro" : "",
    ]
      .filter(Boolean)
      .join(" "),
    btnClass: isHighlighted ? "btn-solid-white" : "btn-outline-blue",
    btnText: "Hubungi Kami",
    priceTitle: isConsultation ? "Hubungi Kami" : undefined,
    priceSubtext: isConsultation
      ? "Paket khusus sesuai kebutuhan bisnis Anda"
      : undefined,
    icon: isFeatured ? Crown : Box,
  };
}

/**
 * Composable: mengambil daftar paket langganan dari backend untuk section Paket Harga.
 * Endpoint `GET /api/packages` bersifat publik (tanpa auth).
 */
export function usePaketHarga() {
  const items = ref<LandingPackageCard[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pricingPlans = computed(() => items.value);

  async function fetchPackages() {
    loading.value = true;
    error.value = null;

    try {
      const res = await packagesApi.getAll({ isActive: true });
      const data = Array.isArray(res.data) ? res.data : [];

      // Paket dengan harga tertinggi (selain paket konsultasi) ditandai sebagai "Populer"
      const maxPrice = data
        .filter((p) => !p.isConsultation)
        .reduce((max, p) => Math.max(max, p.price ?? 0), 0);

      items.value = data.map((p) =>
        mapPackageToCard(
          p,
          !p.isConsultation && (p.price ?? 0) === maxPrice && maxPrice > 0,
        ),
      );
    } catch (err: any) {
      error.value =
        err?.data?.message || err?.message || "Gagal memuat daftar paket.";
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchPackages);

  return { pricingPlans, loading, error, fetchPackages };
}
