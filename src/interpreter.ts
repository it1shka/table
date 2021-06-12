import { BINARY_OPERATOR, EXPRESSION, PROGRAM, STATEMENT, UNARY_OPERATOR, VARIABLE } from "./nodes";

// stack for managing scopes with variables
// it can enter the scope (push new scope onto the stack)
// or leave the scope (pop the last scope from the stack)
// as well as initialize. set and get variables
class ScopeStack {
    private stack: Array<Map<string, number>> = /*[new Map]*/[]
    
    public enter(): void {
        this.stack.push(new Map)
    }

    public leave(): void {
        this.stack.pop()
    }

    public get(key: string): number {
        for(let i = this.stack.length - 1; i >= 0; i--) {
            if(this.stack[i].has(key))
                return this.stack[i].get(key)!
        }
        return 0
    }

    public set(key: string, value: number): number {
        for(let i = this.stack.length - 1; i >= 0; i--) {
            if(this.stack[i].has(key))
                this.stack[i].set(key, value)
        }
        return value
    }

    public init(key: string, value?: number): void {
        this.stack[this.stack.length - 1].set(key, value??0)
    }
}

type BinaryOperation = (a: number, b: number) => number

type UnaryOperation = (a: number) => number

const BinaryOperations: Record<BINARY_OPERATOR, BinaryOperation> = {
    '!=': (a, b) => Number(a != b),
    '*':  (a, b) => a * b,
    '+':  (a, b) => a + b,
    '-':  (a, b) => a - b,
    '/':  (a, b) => a / b,
    '<':  (a, b) => Number(a < b),
    '<=': (a, b) => Number(a <= b),
    '=':  (_, b) => b,
    '==': (a, b) => Number(a == b),
    '>':  (a, b) => Number(a > b),
    '>=': (a, b) => Number(a >= b),
    'and': (a, b) => Number(a && b),
    'mod': (a, b) => a % b,
    'or':  (a, b) => Number(a || b)
}

const UnaryOperations: Record<UNARY_OPERATOR, UnaryOperation> = {
    '-': a => -a,
    'not': a => Number(!Boolean(a))
}

// interpreter recursively traverses and evaluates
// each node of the program
// it saves its state (vars) inside the ScopeStack
export class Interpreter {

    private readonly stack: ScopeStack = new ScopeStack

    public run(program: PROGRAM): void {
        this.execute_statement_list(program)
    }

    private execute_statement_list(statements: STATEMENT[]): void {
        this.stack.enter()
        statements.forEach(statement => this.execute_statement(statement))
        this.stack.leave()
    }

    private execute_statement(statement: STATEMENT): void {
        switch(statement.type) {
            case 'expression-statement':
                this.execute_expression(statement.expression)
            break

            case 'if':
                if(Boolean(this.execute_expression(statement.condition))) {
                    this.execute_statement_list(statement.body)
                } else if(statement.else) {
                    this.execute_statement_list(statement.else)
                }
            break

            case 'let':
                this.stack.init(statement.identifier, 
                    statement.initial_value 
                        ? this.execute_expression(statement.initial_value)
                        : 0)
            break

            case 'loop':
                while(this.execute_expression(statement.condition)) {
                    this.execute_statement_list(statement.body)
                }
            break

            case 'output':
                console.log(this.execute_expression(statement.expression))
            break
        }
    }

    private execute_expression(expression: EXPRESSION): number {
        switch(expression.type) {
            case 'binary':
                if(expression.operator == '=') {
                    const id = (expression.left as VARIABLE).identifier
                    const val = this.execute_expression(expression.right)
                    this.stack.set(id, val)
                    return val
                } 
                return BinaryOperations[expression.operator](
                    this.execute_expression(expression.left),
                    this.execute_expression(expression.right)
                )
            
            case 'in-brackets':
                return this.execute_expression(expression.expression)

            case 'number':
                return expression.value

            case 'unary-operation':
                return UnaryOperations[expression.operator](
                    this.execute_expression(expression.expression)
                )

            case 'variable':
                return this.stack.get(expression.identifier)
        }
    }

}