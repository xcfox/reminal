import { SchemaBuilder } from 'reminal'
import { commands } from '../src/App'
import fs from 'fs'

const schema = new SchemaBuilder(commands).buildJsonSchema()
const json = JSON.stringify(schema, null, 2)

fs.writeFile('./commands-schema.json', json, (err) => {
  if (err) {
    console.error(err)
  } else {
    console.log('Schema saved to schema.json')
  }
})
