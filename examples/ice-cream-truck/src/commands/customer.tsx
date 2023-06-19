import { command, commandGroup } from 'reminal'
import { Menu, MenuItemProps } from '../views/menu'
import { ProductCategory } from '../models'
import { iceCreamFlavors, toppings } from '../models/products'
import { BuyIceCream } from '../views/buy'

const menuItems: Partial<Record<ProductCategory, MenuItemProps[]>> = {
  'ice-cream': iceCreamFlavors,
}

export const menu = command('menu')
  .description('查看菜单')
  .action(() => {
    return <Menu {...{ menuItems }} />
  })

export const buy = commandGroup('buy')
  .description('购买商品')
  .add(
    command('ice-cream')
      .description('购买冰淇淋')
      .option(
        'flavor',
        `口味：${iceCreamFlavors.map((f) => f.flavor).join(' | ')}`,
        { type: String, default: 'vanilla' }
      )
      .option('size', '分量：small | normal | large', { type: String })
      .option('sweetness', '甜度：0-10', { type: Number })
      .option('topping', `配料：${toppings.map((t) => t.name).join(' | ')}`, {
        type: [String],
      })
      .action(async ({ options, reminal }) => {
        const param = await new Promise<Required<typeof options>>(
          (resolve, reject) => {
            reminal.addLine(
              <BuyIceCream {...{ ...options, resolve, reject }} />
            )
          }
        )
        return JSON.stringify(param, null, 2)
      })
  )
