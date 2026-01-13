export const formatCash = (cents: number) => {
  const value = cents / 100;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
};

export const formatPrice = (cents: number) => `${cents}¢`;
