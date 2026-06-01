/**
 * 数値を日本円のフォーマットに変換
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '¥0';
  return `¥${Number(value).toLocaleString()}`;
};