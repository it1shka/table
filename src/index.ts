import {Lexer} from './lexer'
import {Parser} from './parser'

const program = `
#this is a comment
loop else
#this is also
#`

const tokens = new Lexer(program).tokenize()
const ast = new Parser(tokens).parse_program()

console.log(ast)