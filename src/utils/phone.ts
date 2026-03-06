/**
 * Normalizes a Brazilian phone number to E.164 simplified format: "55DDDNUMERO"
 * @param phone The phone number string
 * @returns Normalized phone number or null if invalid
 */
export function normalizeWhatsAppNumber(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If it's a Brazilian number without country code (10 or 11 digits)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }

  // Basic validation: must be between 10 and 15 digits (global standard E.164 is up to 15)
  // For Brazil specifically, it's usually 12 or 13 digits (55 + 10 or 11)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}
