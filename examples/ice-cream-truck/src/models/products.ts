import { Topping } from '.'
import { MenuItemProps } from '../views/menu'

export interface IceCreamFlavorI extends MenuItemProps {
  flavor: string
}

export class IceCreamFlavor implements IceCreamFlavorI {
  cover?: string | undefined
  bgColor?: string | undefined
  constructor(
    public flavor: string,
    public name: string,
    public price: number,
    options: {
      cover?: string | undefined
      bgColor?: string | undefined
    } = {}
  ) {
    this.cover = options.cover
    this.bgColor = options.bgColor
  }
  get command() {
    return `buy ice-cream --flavor ${this.flavor}`
  }
}

export const iceCreamFlavors: IceCreamFlavorI[] = [
  {
    name: '抹茶冰淇淋',
    flavor: 'matcha',
    price: 8,
    cover: '/ice-cream-matcha.png',
    bgColor: '#F7FEEC',
    command: 'buy ice-cream --flavor matcha',
  },
  {
    name: '香草原味冰淇淋',
    flavor: 'vanilla',
    price: 6,
    cover: '/ice-cream-vanilla.png',
    bgColor: '#FCF4ED',
    command: 'buy ice-cream --flavor vanilla',
  },
  {
    name: '草莓冰淇淋',
    flavor: 'strawberry',
    price: 8,
    cover: '/ice-cream-strawberry.png',
    bgColor: '#FDECED',
    command: 'buy ice-cream --flavor strawberry',
  },
  {
    name: '巧克力冰淇淋',
    flavor: 'chocolate',
    price: 8,
    cover: '/ice-cream-chocolate.png',
    bgColor: '#FCF1ED',
    command: 'buy ice-cream --flavor chocolate',
  },
]

export const toppings: Topping[] = [
  {
    name: '巧克力',
    price: 2,
  },
  {
    name: '草莓',
    price: 2,
  },
  {
    name: '蓝莓',
    price: 2,
  },
  {
    name: '糖果',
    price: 2,
  },
  {
    name: '曲奇',
    price: 2,
  },
]
