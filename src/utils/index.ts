export const getISTDate = (hours: number, minutes: number, seconds: number) => {
  const date = new Date();
  // Set the time to the given hours, minutes, and seconds
  date.setUTCHours(hours - 5, minutes - 30, seconds, 0); // IST is UTC+5:30
  return date;
};

export const getYearRange = (year: number) => {
  const yearInt = year;
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${yearInt + 1}-01-01T00:00:00.000Z`);
  return { start, end };
};

export function calculateDiscountPercentage(
  basePrice: number,
  discountPrice?: number
): number {
  if (discountPrice === undefined || discountPrice >= basePrice) {
    return 0;
  }

  const discount = basePrice - discountPrice;
  const discountPercentage = (discount / basePrice) * 100;

  return Math.round(discountPercentage);
}

export function generateReceiptNumber(): string {
  // Generate a timestamp
  const timestamp = Date.now();

  // Generate a random 4-digit number
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  // Combine timestamp and random number to form the receipt number
  return `REC-${timestamp}-${randomNumber}`;
}
