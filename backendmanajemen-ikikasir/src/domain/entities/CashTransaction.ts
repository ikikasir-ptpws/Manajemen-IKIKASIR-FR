export interface CashTransactionProps {
  id: string;
  type: 'masuk' | 'keluar' | string;
  category: string;
  desc: string;
  amount: number;
  date: Date;
  rawDate?: string | null;
  displayDate?: string | null;
  time?: string | null;
  customer?: string | null;
  paymentMethod?: string | null;
  paymentProofUrl?: string | null;
  status?: string | null;
  invoiceNo?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CashTransaction {
  public readonly id: string;
  public readonly type: 'masuk' | 'keluar' | string;
  public readonly category: string;
  public readonly desc: string;
  public readonly amount: number;
  public readonly date: Date;
  public readonly rawDate: string;
  public readonly displayDate: string;
  public readonly time: string;
  public readonly customer: string;
  public readonly paymentMethod: string;
  public readonly paymentProofUrl: string;
  public readonly status: string;
  public readonly invoiceNo: string;
  public readonly notes: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: CashTransactionProps) {
    this.id = props.id;
    this.type = props.type;
    this.category = props.category;
    this.desc = props.desc;
    this.amount = props.amount;
    this.date = props.date;
    this.rawDate = props.rawDate || this.formatRawDate(props.date);
    this.displayDate = props.displayDate || this.formatDisplayDate(props.date);
    this.time = props.time || this.formatTime(props.date);
    this.customer = props.customer || '';
    this.paymentMethod = props.paymentMethod || 'Tunai';
    this.paymentProofUrl = props.paymentProofUrl || '';
    this.status = props.status || 'Selesai';
    this.invoiceNo = props.invoiceNo || '';
    this.notes = props.notes || '';
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private formatRawDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()] || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private formatTime(d: Date): string {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} WIB`;
  }
}
