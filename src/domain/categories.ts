import type { AppLanguage, Category, CategoryId, LocalizedCategory } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', labels: { ja: '食費', en: 'Food', id: 'Makanan' }, color: '#D76C3F' },
  { id: 'transport', labels: { ja: '交通費', en: 'Transport', id: 'Transportasi' }, color: '#4C76B8' },
  { id: 'housing', labels: { ja: '住居費', en: 'Housing', id: 'Tempat tinggal' }, color: '#7E69A8' },
  { id: 'study', labels: { ja: '学業', en: 'Study', id: 'Pendidikan' }, color: '#B98A35' },
  { id: 'communications', labels: { ja: '通信費', en: 'Communications', id: 'Komunikasi' }, color: '#3E8D7B' },
  { id: 'entertainment', labels: { ja: '娯楽', en: 'Entertainment', id: 'Hiburan' }, color: '#B95770' },
  { id: 'daily-goods', labels: { ja: '日用品', en: 'Daily goods', id: 'Kebutuhan harian' }, color: '#718C4C' },
  { id: 'other', labels: { ja: 'その他', en: 'Other', id: 'Lainnya' }, color: '#69788E' },
];

const categoryMap = new Map<CategoryId, Category>(CATEGORIES.map((category) => [category.id, category]));

export function getCategories(language: AppLanguage): LocalizedCategory[] {
  return CATEGORIES.map(({ id, color, labels }) => ({ id, color, label: labels[language] }));
}

export function getCategory(categoryId: CategoryId, language: AppLanguage): LocalizedCategory {
  const category = categoryMap.get(categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
  return { id: category.id, color: category.color, label: category.labels[language] };
}
