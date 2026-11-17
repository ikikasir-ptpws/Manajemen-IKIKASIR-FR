import { describe, expect, it } from 'vitest';
import { confirmWithdrawalSchema } from '../presentation/validations/referral.validation.js';

describe('Validasi konfirmasi pencairan referral', () => {
  it('menolak konfirmasi selesai tanpa bukti pembayaran', () => {
    const result = confirmWithdrawalSchema.safeParse({ status: 'SELESAI' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['paymentProofUrl']);
    }
  });

  it('menerima penolakan tanpa bukti pembayaran jika alasan diberikan', () => {
    const result = confirmWithdrawalSchema.safeParse({
      status: 'DITOLAK',
      rejectionReason: 'Data rekening tidak valid',
    });

    expect(result.success).toBe(true);
  });
});
