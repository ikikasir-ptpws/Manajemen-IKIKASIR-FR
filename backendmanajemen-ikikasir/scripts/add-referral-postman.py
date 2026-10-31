import json

path = 'IKIKASIR_Manajemen_API.postman_collection.json'
with open(path, encoding='utf-8') as f:
    d = json.load(f)

auth_header = [
    {"key": "Content-Type", "value": "application/json"},
    {"key": "Authorization", "value": "Bearer {{token}}"},
]

referral_folder = {
    "name": "REFERRAL (KODE REFERAL & KOMISI)",
    "item": [
        {
            "name": "GET Validasi Kode Referral (Halaman Tambah Client)",
            "request": {
                "method": "GET",
                "header": auth_header,
                "url": {
                    "raw": "{{baseUrl}}/referrals/validate?code={{testReferralCode}}",
                    "host": ["{{baseUrl}}"],
                    "path": ["referrals", "validate"],
                    "query": [
                        {"key": "code", "value": "{{testReferralCode}}"},
                    ],
                },
                "description": "Memvalidasi kode referral yang diketik admin pada halaman Tambah Client. Mengembalikan informasi pelanggan pengundang (upline) bila kode valid."
            },
            "response": [],
        },
        {
            "name": "GET Ringkasan Referral Pelanggan (Halaman Referral)",
            "request": {
                "method": "GET",
                "header": auth_header,
                "url": {
                    "raw": "{{baseUrl}}/referrals/customers/{{testCustomerId}}",
                    "host": ["{{baseUrl}}"],
                    "path": ["referrals", "customers", "{{testCustomerId}}"],
                },
                "description": "Mengambil ringkasan halaman Referral: kode referal, upline, saldo tersedia, total komisi, daftar client yang di-invite, dan riwayat pencairan."
            },
            "response": [],
        },
        {
            "name": "POST Permintaan Pencairan Saldo Referral",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var res = pm.response.json();",
                            "if (res.success && res.data && res.data.id) {",
                            "    pm.collectionVariables.set('testReferralWithdrawalId', res.data.id);",
                            "}"
                        ],
                        "type": "text/javascript",
                    },
                }
            ],
            "request": {
                "method": "POST",
                "header": auth_header,
                "body": {
                    "mode": "raw",
                    "raw": json.dumps(
                        {
                            "amount": 10000,
                            "bankOrWallet": "BCA",
                            "accountNumber": "8230192841",
                            "accountHolder": "Budi Santoso",
                            "notes": "Penarikan saldo komisi referral",
                        },
                        indent=2,
                    ),
                },
                "url": {
                    "raw": "{{baseUrl}}/referrals/customers/{{testCustomerId}}/withdrawals",
                    "host": ["{{baseUrl}}"],
                    "path": ["referrals", "customers", "{{testCustomerId}}", "withdrawals"],
                },
                "description": "Pelanggan mengajukan pencairan saldo komisi referral. Status awal MENUNGGU_VERIFIKASI (menunggu finance)."
            },
            "response": [],
        },
        {
            "name": "PATCH Verifikasi Pencairan Referral (Finance)",
            "request": {
                "method": "PATCH",
                "header": auth_header,
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({"status": "SELESAI"}, indent=2),
                },
                "url": {
                    "raw": "{{baseUrl}}/referrals/withdrawals/{{testReferralWithdrawalId}}",
                    "host": ["{{baseUrl}}"],
                    "path": ["referrals", "withdrawals", "{{testReferralWithdrawalId}}"],
                },
                "description": "Finance memverifikasi pencairan referral. Status: MENUNGGU_VERIFIKASI -> SELESAI atau DITOLAK."
            },
            "response": [],
        },
    ],
}

d['item'] = [folder for folder in d['item'] if folder.get('name') != referral_folder['name']]
d['item'].append(referral_folder)

existing_vars = {v['key'] for v in d.get('variable', [])}
for key, value in [
    ('testReferralCode', 'IKIKASIR-XXXXX'),
    ('testReferralWithdrawalId', ''),
]:
    if key not in existing_vars:
        d.setdefault('variable', []).append({"key": key, "value": value, "type": "string"})

with open(path, 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')

print('Postman collection updated')
