import fs from 'fs'
import {Lexer} from './lexer'
import {Parser} from './parser'
import {Analyzer} from './analyzer'
import {Interpreter} from './interpreter'
import {Compiler} from './emitter'

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
        Analyzer(ast)

        const compiler = new Compiler(ast)
        const binary = compiler.compile()
        const wasm_module = new WebAssembly.Module(binary)
        const instance = new WebAssembly.Instance(wasm_module, {
            env: {
                output: console.log
            }
        })
        
        return JSON.stringify({
            status: 'success'
        })
    } catch(err) {
        return JSON.stringify({
            status: 'error',
            info: err
        })
    }
}

run_test_program()