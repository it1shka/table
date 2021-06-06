import {Lexer} from './lexer'
import {Parser} from './parser'

const program = `
loop @
#`

const tokens = new Lexer(program).tokenize()
const ast = new Parser(tokens).parse_program()

console.log(ast)