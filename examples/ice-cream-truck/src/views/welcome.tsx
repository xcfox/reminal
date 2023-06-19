import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from '@nextui-org/react'
import { useReminal } from 'reminal'
import { oneOf } from '../utils/one-of'
import { memo, useMemo } from 'react'
import { ScrollText } from 'lucide-react'

const tagline = [
  '来一份冰凉爽口的冰淇淋，解暑又解馋！',
  '炎炎夏日，来一杯冰淇淋，清凉怡人。',
  '多种口味任你选择，满足不同的味蕾需求。',
  '尝试我们的特色奶油冰淇淋，口感绵软，入口即化。',
  '小朋友最爱的彩虹冰淇淋，现在免费加冰激凌饼干哦！',
  '快来品尝我们的限定版甜筒冰淇淋，一口下去童话般的美味。',
]

export const Welcome = memo(() => {
  const reminal = useReminal()
  const description = useMemo(() => oneOf(...tagline), [])
  return (
    <Card className="bg-[#EBD0E0] relative w-[570px] lg:w-[800px] min-h-[240px] pl-[220px]">
      <img className="z-0 absolute left-0 top-0 h-full" src="/truck.png"></img>
      <CardHeader>
        <h1 className="text-4xl text-sky-800">
          <span>欢迎光临</span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
            冰淇淋卡车
          </span>
        </h1>
      </CardHeader>
      <CardBody>
        <p>{description}</p>
      </CardBody>
      <CardFooter>
        <div className="flex">
          <Button
            color="secondary"
            className="mr-4"
            onPress={() => reminal.execute('buy ice-cream')}
          >
            来一份冰淇淋
          </Button>
          <Button
            color="primary"
            className="mr-4"
            onPress={() => reminal.execute('menu')}
          >
            查看菜单
          </Button>
          <Button color="primary" isIconOnly>
            <ScrollText />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
})
