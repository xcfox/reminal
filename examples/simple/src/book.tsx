import { command, commandGroup } from 'reminal'

class Book {
  constructor(public name: string, public author: string) {}
}

const bookList: Book[] = [
  new Book('The Gods Themselves', 'Isaac Asimov'),
  new Book('Rendezvous with Rama', 'Arthur Charles Clarke'),
]

export const book = commandGroup('book')
  .description('Manage books: add books, view book information, delete books')
  .add(
    command('add')
      .description('Add Books')
      .option('name', 'book name', { required: true })
      .option('author', 'book author', { required: true })
      .action(({ options: { name, author } }) => {
        bookList.push(new Book(name, author))
        return 'success added'
      })
  )
  .add(
    command('list')
      .description('View Book List')
      .action(() => {
        return (
          <div>
            <h1>Book List</h1>
            <ul>
              {bookList.map((book) => (
                <li>
                  {book.name} - {book.author}
                </li>
              ))}
            </ul>
          </div>
        )
      })
  )
  .add(
    command('delete')
      .description('Delete Books')
      .argument('name', 'Book Name', { type: [String] })
      .action(({ args }) => {
        const index = bookList.findIndex((book) => book.name === args[0])
        if (index === -1) {
          return 'not found'
        }
        const book = bookList[index]
        bookList.splice(index, 1)
        return `deleted: ${book.name} - ${book.author}`
      })
  )
