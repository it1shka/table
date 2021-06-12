import fs from 'fs'
import {Lexer} from './lexer'
import {Parser} from './parser'
import {Analyzer} from './analyzer'
import {Interpreter} from './interpreter'
import {Compiler} from './emitter'

function run_test_program(): void {
    const test_program_path = 'example.txt'
    const program = fs.readFileSync(test_program_path, {encoding: 'utf-8'})
    run_code(program, true)
}

export default function run_code(program: string, interpr = false) {
    try {
        const lexer = new Lexer(program)
        const tokens = lexer.tokenize()
        const parser = new Parser(tokens)
        const ast = parser.parse_program()
        Analyzer(ast)
        
        if(interpr)
            new Interpreter().run(ast)
        else {
            const compiler = new Compiler(ast)
            const binary = compiler.compile()
            const wasm_module = new WebAssembly.Module(binary)
            const instance = new WebAssembly.Instance(wasm_module, {
                env: {
                    output: console.log,
                    int: parseInt,
                    float: parseFloat
                }
            })
        }
    } catch(err) {
        console.error(err)
    }
}

run_test_program()