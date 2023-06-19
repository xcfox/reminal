import { command } from 'reminal'
import { Welcome } from '../views/welcome'
import { buy, menu } from './customer'

const welcome = command('welcome')
  .alias('hi', 'hello')
  .description('展示欢迎信息')
  .action(() => <Welcome />)

export const commands = [menu, welcome, buy]
