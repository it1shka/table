import { Token } from "./lexer";
import { BINARY_OPERATOR, EXPRESSION, EXPRESSION_STATEMENT, IF, LET, LOOP, OUTPUT, PRIMARY, PROGRAM, STATEMENT } from "./nodes";

class TokenBuffer {
    constructor(private tokens: Token[]) {}

    public peek(): Token | undefined {
        return this.tokens[0]
    }

    public next(): Token | undefined {
        return this.tokens.shift()
    }

    public eof(): boolean {
        return this.peek() == undefined
    }

    public peek_type() {
        return this.peek()?.type
    }

    public peek_span(): string | undefined {
        return this.peek()?.span
    }

    public peek_pos(): {line: number, column: number} {
        let pos
        if( (pos = this.peek()) !== undefined) {
            const {line, column} = pos
            return {line, column}
        }
        throw `Parser error: unexpected EOF while parsing`
    }

    public exclude_pos(): {line: number, column: number} {
        if(this.peek() !== undefined) {
            const {line, column} = this.next() as Token
            return {line, column}
        }
        throw `Parser error: unexpected EOF while parsing`
    }

    public required(span: string): void {
        let next
        if( (next = this.next())?.span !== span)
            throw `Parser error: expected token be equal to "${span}", found ${next}`
    }

    public maybe(span: string): boolean {
        if(this.peek()?.span === span) {
            this.next()
            return true
        }
        return false
    }

}

export class Parser {
    private readonly buffer: TokenBuffer
    constructor(tokens: Token[]) {
        this.buffer = new TokenBuffer(tokens)
    }

    public parse_program(): PROGRAM {
        const statements: STATEMENT[] = []
        while(!this.buffer.eof()) {
            const statement = this.parse_statement()
            statements.push(statement)
        }
        return statements
    }

    private parse_statement(): STATEMENT {
        switch(this.buffer.peek_span()) {
            case 'if':      return this.parse_if()
            case 'loop':    return this.parse_loop()
            case 'let':     return this.parse_let()
            case 'output':  return this.parse_output()
            default:        return this.parse_expression_statement()
        }
    }

    private parse_if(): IF {
        const pos = this.buffer.exclude_pos()
        const condition = this.parse_expression()
        const body = this.parse_statement_list()
        let else_body
        if(this.buffer.maybe('else'))
            else_body = this.parse_statement_list()
        return IF(condition, body, else_body, pos)
    }

    private parse_loop(): LOOP {
        const pos = this.buffer.exclude_pos()
        const condition = this.parse_expression()
        const body = this.parse_statement_list()
        return LOOP(condition, body, pos)
    }

    private parse_let(): LET {
        const pos = this.buffer.exclude_pos()
        if(this.buffer.peek_type() !== 'identifier') {
            throw `Parser error: expected identifier, found ${this.buffer.next()}`
        }
        const identifier = this.buffer.next()?.span as string
        let initial_value
        if(this.buffer.maybe('=')) {
            initial_value = this.parse_expression()
        }
        this.buffer.required(';')
        return LET(identifier, initial_value, pos)
    }

    private parse_output(): OUTPUT {
        const pos = this.buffer.exclude_pos()
        const expression = this.parse_expression()
        this.buffer.required(';')
        return OUTPUT(expression, pos)
    }

    private parse_expression_statement(): EXPRESSION_STATEMENT {
        const pos = this.buffer.peek_pos()
        const expression = this.parse_expression()
        this.buffer.required(';')
        return EXPRESSION_STATEMENT(expression, pos)
    }

    private parse_statement_list(): STATEMENT[] {
        const statements: STATEMENT[] = []
        this.buffer.required('{')
        while(this.buffer.peek_span() !== '}') {
            const statement = this.parse_statement()
            statements.push(statement)
        }
        this.buffer.required('}')
        return statements
    }

    private parse_expression(): EXPRESSION {
        let result = this.parse_or()
        if(this.buffer.maybe('=')) {
            if(result.type !== 'variable') 
            throw `Parser error: expected identifier in assignment, found ${result}`
            const right = this.parse_expression()
            result = {
                type: 'binary',
                operator: '=',
                left: result,
                right
            }
        }
        return result
    }

    private parse_or(): EXPRESSION {
        return (
        this.parse_expression_with(['or']                   ,() =>
        this.parse_expression_with(['and']                  ,() => 
        this.parse_expression_with(['==', '!=']             ,() => 
        this.parse_expression_with(['<', '>', '<=', '>=']   ,() => 
        this.parse_expression_with(['+', '-']               ,() => 
        this.parse_expression_with(['*', '/', 'mod']        ,() => 
        this.parse_primary()                                ))))))
        )
    }

    private parse_primary(): PRIMARY {
        if(this.buffer.maybe('-')) {
            return {
                type: 'unary-operation',
                operator: '-',
                expression: this.parse_primary()
            }
        }
        if(this.buffer.maybe('not')) {
            return {
                type: 'unary-operation',
                operator: 'not',
                expression: this.parse_primary()
            }
        }

        if(this.buffer.maybe('(')) {
            const expression = this.parse_expression()
            this.buffer.required(')')
            return {
                type: 'in-brackets',
                expression
            }
        }

        switch(this.buffer.peek_type()) {
            case 'identifier': return {
                type: 'variable', 
                identifier: this.buffer.next()!.span
            }
            case 'number': return {
                type: 'number',
                value: this.buffer.next()!.span
            }

            default: 
            throw `Parser error: expected identifier or number, found ${this.buffer.next()}`
        }
    }

    private parse_expression_with(
        operators: BINARY_OPERATOR[], 
        parser: () => EXPRESSION
        ): EXPRESSION 
    {
        let result = parser()
        let operator
        while(operators.includes(operator = this.buffer.peek_span() as BINARY_OPERATOR)) {
            this.buffer.next()
            const right = parser()
            result = {
                type: 'binary',
                operator,
                left: result,
                right
            }
        }
        return result
    }
}