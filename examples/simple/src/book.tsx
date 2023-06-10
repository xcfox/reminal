import { command, commandGroup } from 'reminal'

class Book {
  constructor(public name: string, public author: string) {}
}

const bookList: Book[] = [
  new Book('三体', '刘慈欣'),
  new Book('神的九十亿个名字', '阿瑟•克拉克'),
  new Book('红楼梦', '曹雪芹'),
  new Book('西游记', '吴承恩'),
  new Book('水浒传', '施耐庵'),
  new Book('三国演义', '罗贯中'),
  new Book('西厢记', '王实甫'),
  new Book('儒林外史', '吴敬梓'),
  new Book('金瓶梅', '兰陵笑笑生'),
]

export const book = commandGroup('book')
  .description('管理图书：添加图书，查看书籍信息，借书，还书')
  .add(
    command('add')
      .description('添加图书')
      .option('book.name', '书名', { required: true })
      .option('book.author', '作者', { required: true })
      .option('lendOut', '是否借出', { type: Boolean })
      .action(({ options }) => {
        bookList.push(new Book(options.book.name, options.book.author))
        return '添加成功'
      })
  )
  .add(
    command('list')
      .description('查看图书列表')
      .action(() => {
        return bookList
          .map((book) => `${book.name} - ${book.author}`)
          .join('\n')
      })
  )
  .add(
    command('delete')
      .description('删除图书')
      .argment('name', '书名', { type: [String] })
      .action(({ argments }) => {
        const index = bookList.findIndex((book) => book.name === argments[0])
        if (index === -1) {
          return '图书不存在'
        }
        const book = bookList[index]
        bookList.splice(index, 1)
        return `删除成功：${book.name} - ${book.author}`
      })
  )
