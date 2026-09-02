// Global postal code check
export function isValidZipCode(zipCode: string): boolean {
  const trimmed = zipCode.trim();
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{1,9}$/.test(trimmed) && /\d/.test(trimmed);
}

// punctuation/spacing is stripped: 10 digits, or 11 with a leading country code 1.
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}
