export const productCategory = ['ice-cream', 'beverages', 'desserts'] as const

export type ProductCategory = (typeof productCategory)[number]

export interface Topping {
  name: string
  price: number
}
