import { SYSTEM_MESSAGES } from '../constants/messages';

/**
 * フォーム入力値の検証ルール集
 */
export const validators = {
  required: (value, fieldName = 'この項目') => {
    if (!value || String(value).trim() === '') {
      return SYSTEM_MESSAGES.VALIDATION.REQUIRED(fieldName);
    }
    return '';
  },

  email: (value) => {
    if (!value) return '';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? '' : SYSTEM_MESSAGES.VALIDATION.EMAIL_FORMAT;
  },

  minNumber: (value, min, fieldName = '値') => {
    if (value === null || value === undefined) return '';
    return (Number(value) >= min) ? '' : SYSTEM_MESSAGES.VALIDATION.MIN_NUMBER(fieldName, min);
  },

  match: (val1, val2, fieldName = '確認用パスワード') => {
    return (val1 === val2) ? '' : SYSTEM_MESSAGES.VALIDATION.MATCH(fieldName);
  }
};