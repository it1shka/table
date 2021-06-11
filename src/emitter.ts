import bn from 'binaryen'
import { BINARY, BINARY_OPERATOR, EXPRESSION, PROGRAM, STATEMENT, UNARY_OPERATION, UNARY_OPERATOR, VARIABLE } from './nodes'

// returns map object which contains pairs 
// "{variable name}" : {variable index (starting from 0)}
function Precompiler(program: PROGRAM) {
    const map: Map<string, number> = new Map
    let last_index = 0
    program.forEach(statement => {
        if(statement.type === 'let')
            map.set(statement.identifier, last_index++)
    })
    return {
        amount: last_index,
        variables: map
    }
}

const no_label  = null as any as string 
const no_params = bn.createType([])

type BinaryOperation = (left: number, right: number) => number

type UnaryOperation = (num: number) => number

export class Compiler {
    private readonly module = new bn.Module
    private readonly variables: Map<string, number>
    private readonly amount: number

    private readonly binary_operations: Record<BINARY_OPERATOR, BinaryOperation> = {
        '!=': this.module.f64.ne,
        '*':  this.module.f64.mul,
        '+':  this.module.f64.add,
        '-': this.module.f64.sub,
        '/': this.module.f64.div,
        '<': this.module.f64.lt,
        '<=': this.module.f64.le,
        '=': null as any as BinaryOperation,
        '==': this.module.f64.eq,
        '>': this.module.f64.gt,
        '>=': this.module.f64.ge,
        'and': this.module.i32.and,
        'mod': this.module.i32.rem_s,
        'or': this.module.i32.or
    } as const

    private readonly unary_operations: Record<UNARY_OPERATOR, UnaryOperation> = {
        'not': this.module.i32.eqz,
        '-': this.module.f64.neg
    } as const

    private var(key: string): number {
        return this.variables.get(key)!
    }

    constructor(private readonly program: PROGRAM) {
        const {variables, amount} = Precompiler(program)
        this.variables = variables
        this.amount = amount
    }

    public compile(): Uint8Array {
        // exporting output function
        this.module.addFunctionImport(
            'output',
            'env',
            'output',
            bn.createType([ bn.f64 ]),
            bn.none
        )
        // all the code will be wrapped
        // inside 'main' function
        this.module.addFunction(
            'main', 
            no_params, 
            bn.none, 
            new Array(this.amount).fill(bn.f64),
            this.compile_statement_list(this.program)
        )
        this.module.setStart(this.module.getFunction('main'))
        this.module.autoDrop()
        //this.module.optimize()
        this.module.validate()
        const compiled_binary = this.module.emitBinary()
        return compiled_binary
    }

    private compile_statement(statement: STATEMENT): number {
        switch(statement.type) {
            case 'if': 
            return this.module.if(
                this.compile_expression(statement.condition),
                this.compile_statement_list(statement.body),
                statement.else ? this.compile_statement_list(statement.else) : undefined
            )

            case 'expression-statement':
            return this.compile_expression(statement.expression)

            case 'let':
            return this.module.local.set(
                this.var(statement.identifier),
                statement.initial_value 
                    ? this.compile_expression(statement.initial_value)
                    : this.module.f64.const(0)
            )

            case 'output':
            return this.module.call(
                'output',
                [this.compile_expression(statement.expression)],
                bn.none
            )

            case 'loop':
            return this.module.block('outer', [
                this.module.loop('loop', this.module.block(no_label,[
                    this.module.br('outer', this.module.i32.eqz(
                        this.compile_expression(statement.condition)
                    )),
                    this.compile_statement_list(statement.body),
                    this.module.br('loop')
                ]))
            ])
        }
    }

    private compile_statement_list(list: STATEMENT[]): number {
        return this.module.block(
            no_label,
            list.map(statement => 
                this.compile_statement(statement))
        )
    }

    private compile_expression(expression: EXPRESSION): number {
        switch(expression.type) {
            case 'variable':
            return this.module.local.get(
                this.var(expression.identifier),
                bn.f64
            )

            case 'number':
            return this.module.f64.const(expression.value)

            case 'in-brackets':
            return this.compile_expression(expression.expression)

            case 'binary':
            return this.compile_binary_expression(expression)

            case 'unary-operation':
            return this.compile_unary_expression(expression)
        }
    }

    private compile_binary_expression(expression: BINARY): number {

        if(expression.operator === '=') {
            const ind = this.var( (expression.left as VARIABLE).identifier )
            return this.module.block(
                no_label,[
                    this.module.local.set(
                        ind,
                        this.compile_expression(expression.right)
                    ),
                    this.module.local.get(ind, bn.f64)
                ], bn.f64
            )
        }

        const op = this.binary_operations[expression.operator]
        const left = this.compile_expression(expression.left)
        const right = this.compile_expression(expression.right)
        return op(left, right)
    }

    private compile_unary_expression(expression: UNARY_OPERATION): number {
        const op = this.unary_operations[expression.operator]
        const num = this.compile_expression(expression.expression)
        return op(num)
    }
}