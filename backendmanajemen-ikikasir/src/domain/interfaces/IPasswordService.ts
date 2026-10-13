/**
 * Kontrak Service Hashing & Verifikasi Password
 */
export interface IPasswordService {
  /**
   * Meng-hash plaintext password menggunakan algoritma yang aman (contoh: bcrypt)
   */
  hash(plainText: string): Promise<string>;

  /**
   * Membandingkan plaintext password dengan hash yang tersimpan
   */
  compare(plainText: string, hashed: string): Promise<boolean>;
}
