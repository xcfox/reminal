import { memo } from 'react'
import { Card, CardBody, CardHeader, Image } from '@nextui-org/react'
import { ProductCategory } from '../models'
import { useReminal } from 'reminal'

const categoryToTitle: Record<ProductCategory, string> = {
  'ice-cream': '冰淇淋',
  beverages: '饮料',
  desserts: '甜点',
}

export const Menu = memo<{
  menuItems: Partial<Record<ProductCategory, MenuItemProps[]>>
}>(({ menuItems }) => (
  <Card className="p-3" isBlurred>
    <CardHeader>
      <h1 className="text-3xl">
        <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
          冰淇淋卡车
        </span>
        <span>菜单</span>
      </h1>
    </CardHeader>
    {Object.entries(menuItems).map(([category, items]) => (
      <CardBody key={category}>
        <h2 className="text-2xl font-bold">
          {categoryToTitle[category as ProductCategory]}
        </h2>
        <div className="flex flex-wrap flex-row">
          {items?.map((item) => (
            <MenuItem key={item.name} {...item} />
          ))}
        </div>
      </CardBody>
    ))}
  </Card>
))

export interface MenuItemProps {
  name: string
  price: number
  cover?: string
  bgColor?: string
  command?: string
}

export const MenuItem = memo<MenuItemProps>(
  ({ name, price, cover, bgColor, command }) => {
    const reminal = useReminal()
    return (
      <div
        className="w-[180px] h-[240px] px-4 py-3 m-4 relative cursor-pointer rounded-lg"
        style={{ background: bgColor }}
        onClick={() => {
          if (command) reminal.execute(command)
        }}
      >
        <h3 className="text-xl font-bold">{name}</h3>
        <span className="text-gray-600">¥{price.toFixed(2)}</span>
        {cover && (
          <Image
            isZoomed
            alt={name}
            classNames={{
              wrapper: 'absolute bottom-0 left-0 right-0 top-0',
              zoomedWrapper: 'w-full h-full',
              img: 'w-full h-full object-bottom object-contain',
            }}
            src={cover}
          />
        )}
      </div>
    )
  }
)
