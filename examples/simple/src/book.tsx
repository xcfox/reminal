import { command, commandGroup } from 'reminal'

class Book {
  constructor(public name: string, public author: string) {}
}

const bookList: Book[] = [new Book('三体', '刘慈欣')]

export const book = commandGroup('book')
  .description('管理图书：添加图书，查看书籍信息，借书，还书')
  .add(
    command('add')
      .description('添加图书')
      .option('name', '书名', { required: true })
      .option('author', '作者', { required: true })
      .action(({ options }) => {
        bookList.push(new Book(options.name, options.author))
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
