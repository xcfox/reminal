import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Image,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from '@nextui-org/react'
import { memo, useMemo, useState } from 'react'
import { iceCreamFlavors, toppings } from '../models/products'
import { colord } from 'colord'
import { keyBy } from '../utils/key-by'

export type BuyProps<T> = Partial<T> & {
  resolve: (value: T) => void
  reject: (reason?: any) => void
}

interface IceCream {
  flavor: string
  size: string
  topping: string[]
  sweetness: number
}

export const BuyIceCream = memo<BuyProps<IceCream>>(
  ({
    flavor: flavorI = 'vanilla',
    sweetness: sweetnessI = 8,
    topping: toppingI = [],
    size: sizeI = 'normal',
    reject,
    resolve,
  }) => {
    const [flavor, setFlavor] = useState(flavorI)
    const [sweetness, setSweetness] = useState(sweetnessI)
    const [topping, setTopping] = useState(toppingI)
    const [size, setSize] = useState(sizeI)
    const [finished, setFinished] = useState(false)

    const param = useMemo(
      () => ({
        flavor,
        sweetness,
        topping,
        size,
      }),
      [flavor, size, sweetness, topping]
    )

    const price = useMemo(() => iceCreamPrice(param), [param])

    const info = useMemo(
      () =>
        iceCreamFlavors.find((f) => f.flavor === flavor) ?? iceCreamFlavors[0],
      [flavor]
    )
    return (
      <Card
        style={{
          background: colord(info.bgColor ?? '#FFFFFF')
            .alpha(0.7)
            .toRgbString(),
        }}
        className="relative pl-[200px]"
        isBlurred
      >
        {info.cover && (
          <Image
            className="pointer-events-none transition-background"
            classNames={{
              wrapper: 'absolute bottom-0 left-0 top-0',
              img: 'h-full max-w-[200px] object-contain object-left',
            }}
            src={info.cover}
          />
        )}
        <CardHeader>
          <h1 className="text-3xl font-bold">{info.name}</h1>
        </CardHeader>
        <CardBody>
          <Tabs
            isDisabled={finished}
            selectedKey={flavor}
            onSelectionChange={(key) => setFlavor(key as string)}
          >
            {iceCreamFlavors.map((flavor) => (
              <Tab
                className="whitespace-nowrap"
                key={flavor.flavor}
                title={flavor.name.replace('冰淇淋', '')}
              />
            ))}
          </Tabs>
          <RadioGroup
            isDisabled={finished}
            className="mt-4"
            label="选择甜度"
            orientation="horizontal"
            value={String(sweetness)}
            onValueChange={(value) => setSweetness(Number(value))}
          >
            <Radio value="3">三分甜</Radio>
            <Radio value="5">五分甜</Radio>
            <Radio value="8">八分甜</Radio>
            <Radio value="10">十分甜</Radio>
          </RadioGroup>
          <RadioGroup
            isDisabled={finished}
            className="mt-4"
            label="选择分量"
            orientation="horizontal"
            value={size}
            onValueChange={setSize}
          >
            <Radio value="small">小份</Radio>
            <Radio value="normal">正常</Radio>
            <Radio value="large">大份</Radio>
          </RadioGroup>
          <CheckboxGroup
            isDisabled={finished}
            className="mt-4"
            label="加点小料"
            orientation="horizontal"
            value={topping}
            onChange={setTopping}
          >
            {toppings.map((t) => (
              <Checkbox value={t.name} key={t.name}>
                {t.name}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </CardBody>
        <CardFooter>
          <span className="text-2xl font-bold">￥{price.toFixed(2)}</span>
          <Button
            className="ml-4"
            isDisabled={finished}
            color="primary"
            onPress={() => {
              setFinished(true)
              resolve(param)
            }}
          >
            购买
          </Button>
          <Button
            isDisabled={finished}
            color="danger"
            className="ml-4"
            onPress={() => {
              setFinished(true)
              reject('取消下单')
            }}
          >
            取消
          </Button>
        </CardFooter>
      </Card>
    )
  }
)

export function iceCreamPrice({ flavor, size, topping }: IceCream): number {
  const info = iceCreamFlavors.find((f) => f.flavor === flavor)
  if (!info) return 0
  const base = info.price
  const sizeFactor = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1
  const toppingRecord = keyBy(toppings, 'name')
  const toppingPrize = topping.reduce(
    (sum, t) => sum + toppingRecord[t].price,
    0
  )
  return base * sizeFactor + toppingPrize
}
