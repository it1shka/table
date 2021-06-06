import {Lexer} from './lexer'
import {Parser} from './parser'

import fs from 'fs'

function run_test_program(): void {

    const test_program_path = 'example.txt'
    const debug_output_path = 'debug-output.json'

    const program = fs.readFileSync(test_program_path, {encoding: 'utf-8'})
    const result = run_code(program)
    fs.writeFileSync(debug_output_path, result)

}

export default function run_code(program: string) {
    try {
        const lexer = new Lexer(program)
        const tokens = lexer.tokenize()
        const parser = new Parser(tokens)
        const ast = parser.parse_program()
        return JSON.stringify(ast, null, 4)
    } catch(e) {
        return String(e)
    }
}

run_test_program()