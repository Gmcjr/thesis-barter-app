// US 5-digit zip, optionally with a +4 suffix (e.g. "94103" or "94103-1234").
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zipCode.trim());
}

// punctuation/spacing is stripped: 10 digits, or 11 with a leading country code 1.
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}
