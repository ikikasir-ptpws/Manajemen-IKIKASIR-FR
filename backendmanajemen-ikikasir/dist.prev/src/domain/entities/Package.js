/**
 * Domain Entity: Package (Kelola Paket Langganan)
 * Menyimpan data inti paket langganan yang esensial dan durasi aktifnya
 */
export class Package {
    id;
    name;
    description;
    price;
    period;
    periodType;
    startDate;
    endDate;
    isConsultation;
    features;
    isActive;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description ?? '';
        this.price = props.price ?? 0;
        this.period = props.period ?? '/bulan';
        this.isConsultation = Boolean(props.isConsultation);
        this.features = props.features ?? [];
        this.isActive = props.isActive ?? true;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        // Detect / assign periodType
        if (props.periodType) {
            this.periodType = props.periodType;
        }
        else {
            const p = this.period.toLowerCase();
            if (p.includes('tahun') || p.includes('/thn')) {
                this.periodType = 'tahunan';
            }
            else if (p === '/bulan' || p === 'bulan' || p === '/bln') {
                this.periodType = 'bulanan';
            }
            else {
                this.periodType = 'custom';
            }
        }
        this.startDate = props.startDate ?? null;
        this.endDate = props.endDate ?? null;
    }
    /**
     * Menghitung durasi bulan dari paket langganan
     */
    getDurationMonths() {
        if (this.periodType === 'tahunan')
            return 12;
        if (this.periodType === 'bulanan')
            return 1;
        // Jika memiliki rentang tanggal eksplisit
        if (this.startDate && this.endDate) {
            const d1 = new Date(this.startDate);
            const d2 = new Date(this.endDate);
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                const diff = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
                if (diff > 0)
                    return diff;
            }
        }
        const p = this.period.toLowerCase();
        if (p.includes('tahun') || p.includes('/thn') || p.includes('12 bulan')) {
            return 12;
        }
        const matchMonth = p.match(/(\d+)\s*bulan/);
        if (matchMonth && matchMonth[1]) {
            return parseInt(matchMonth[1], 10);
        }
        // Cek rentang nama bulan
        const monthMap = {
            jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
            jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11
        };
        const rangeMatch = p.match(/(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s*(?:(\d{4})\s*)?[-–—]\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s*(\d{4})?/i);
        if (rangeMatch) {
            const m1 = monthMap[rangeMatch[1].toLowerCase().slice(0, 3)] ?? 0;
            const y1 = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : (rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 2026);
            const m2 = monthMap[rangeMatch[3].toLowerCase().slice(0, 3)] ?? 0;
            const y2 = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : y1;
            const diff = (y2 - y1) * 12 + (m2 - m1) + 1;
            if (diff > 0)
                return diff;
        }
        return 1;
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            price: this.price,
            period: this.period,
            periodType: this.periodType,
            startDate: this.startDate,
            endDate: this.endDate,
            durationMonths: this.getDurationMonths(),
            isConsultation: this.isConsultation,
            features: this.features,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
//# sourceMappingURL=Package.js.map