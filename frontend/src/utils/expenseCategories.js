export { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_STYLES, getExpenseCategoryStyle } from '../constants/categories'
export const EXPENSE_CATEGORIES = ['All', 'Food', 'Water Bill', 'Electricity Bill', 'Transport', 'Entertainment', 'Other']

export const EXPENSE_CATEGORY_STYLES = {
  Food: { icon: 'shopping_basket', bg: 'bg-amber-100', text: 'text-amber-700' },
  'Water Bill': { icon: 'water_drop', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Electricity Bill': { icon: 'electric_bolt', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Transport: { icon: 'directions_car', bg: 'bg-sky-100', text: 'text-sky-700' },
  Entertainment: { icon: 'movie', bg: 'bg-pink-100', text: 'text-pink-700' },
  Utilities: { icon: 'bolt', bg: 'bg-purple-100', text: 'text-purple-700' },
  Rent: { icon: 'home', bg: 'bg-blue-100', text: 'text-blue-700' },
  Other: { icon: 'more_horiz', bg: 'bg-gray-100', text: 'text-gray-700' },
}

export const getExpenseCategoryStyle = (category) => EXPENSE_CATEGORY_STYLES[category] || EXPENSE_CATEGORY_STYLES.Other
