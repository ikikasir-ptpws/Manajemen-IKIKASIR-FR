export class CashTransaction {
    id;
    type;
    category;
    desc;
    amount;
    date;
    rawDate;
    displayDate;
    time;
    customer;
    paymentMethod;
    paymentProofUrl;
    status;
    invoiceNo;
    notes;
    createdAt;
    updatedAt;
    constructor(props) {
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
    formatRawDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    formatDisplayDate(d) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()] || '';
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }
    formatTime(d) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${mins} WIB`;
    }
}
//# sourceMappingURL=CashTransaction.js.map