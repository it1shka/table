import { Token } from "./lexer";
import { BINARY_OPERATOR, EXPRESSION, EXPRESSION_STATEMENT, IF, LET, LOOP, OUTPUT, PRIMARY, PROGRAM, STATEMENT } from "./nodes";
import type {NodeEntry} from './nodes'

// used for error reports 
function format(token: Token | undefined): string {
    return token ? `${token.type} "${token.span}" (line ${token.line}, col ${token.column})` : 'EOF'
}

// additional class that provides
// convenient methods for reading 
// the array of tokens produced by the lexer
class TokenBuffer {
    constructor(private tokens: Token[]) {}

    // returns current token
    public peek(): Token | undefined {
        return this.tokens[0]
    }

    // returns current token and removes it from the stream
    public next(): Token | undefined {
        return this.tokens.shift()
    }

    // returns true if it's an End Of File
    public eof(): boolean {
        return this.peek() == undefined
    }

    public peek_type() {
        return this.peek()?.type
    }

    public peek_span(): string | undefined {
        return this.peek()?.span
    }

    // returns position of current token
    public peek_pos(): NodeEntry {
        let pos
        if( (pos = this.peek()) !== undefined) {
            const {line, column} = pos
            return {line, column}
        }
        throw `unexpected EOF while parsing`
    }

    // return position of current token and skips it
    public exclude_pos(): NodeEntry {
        if(this.peek() !== undefined) {
            const {line, column} = this.next() as Token
            return {line, column}
        }
        throw `unexpected EOF while parsing`
    }

    // checks if the next token span equals to required
    // otherways throws an error
    public required(span: string): void {
        let next
        if( (next = this.next())?.span !== span)
            throw `expected token be equal to "${span}", found ${format(next)}`
    }

    // if current token span == required span -> skips the token 
    // and returns true
    public maybe(span: string): boolean {
        if(this.peek()?.span === span) {
            this.next()
            return true
        }
        return false
    }

}

// main parser class 
// algorithm I used for parsing is called 
// "recursive descent"
// so all the parser code is pretty self-explanatory 
// I used a lot of try-catch constructions for better 
// error logging

export class Parser {
    private readonly buffer: TokenBuffer
    constructor(tokens: Token[]) {
        this.buffer = new TokenBuffer(tokens)
    }

    // program ::= statement*
    public parse_program(): PROGRAM {
        try {
            const statements: STATEMENT[] = []
            while(!this.buffer.eof()) {
                const statement = this.parse_statement()
                statements.push(statement)
            }
            return statements
        }
        catch(e) {
            throw `Parser error:\n${e}`
        }
    }

    // statement ::= if | loop | let | output | expression_statement
    private parse_statement(): STATEMENT {
        switch(this.buffer.peek_span()) {
            case 'if':      return this.parse_if()
            case 'loop':    return this.parse_loop()
            case 'let':     return this.parse_let()
            case 'output':  return this.parse_output()
            default:        return this.parse_expression_statement()
        }
    }

    // if ::= "if" expression statement_list ("else" statement_list)?
    private parse_if(): IF {
        const pos = this.buffer.exclude_pos()
        try {
            const condition = this.parse_expression()
            const body = this.parse_statement_list()
            let else_body
            if(this.buffer.maybe('else'))
                else_body = this.parse_statement_list()
            return IF(condition, body, else_body, pos)
        } catch(e) {
            throw `while parsing if statement at line ${pos.line}, at column ${pos.column}\n${e}`
        }
    }

    // loop ::= "loop" expression statement_list
    private parse_loop(): LOOP {
        const pos = this.buffer.exclude_pos()
        try {
            const condition = this.parse_expression()
            const body = this.parse_statement_list()
            return LOOP(condition, body, pos)
        } catch(e) {
            throw `while parsing loop statement at line ${pos.line}, at column ${pos.column}\n${e}`
        }
    }

    // let ::= "let" identifier ("=" expression)? ";"
    private parse_let(): LET {
        const pos = this.buffer.exclude_pos()
        try {
            if(this.buffer.peek_type() !== 'identifier') {
                throw `expected identifier not ${format(this.buffer.next())} at ${pos.line}, at column ${pos.column}`
            }
            const identifier = this.buffer.next()?.span as string
            let initial_value
            if(this.buffer.maybe('=')) {
                initial_value = this.parse_expression()
            }
            this.buffer.required(';')
            return LET(identifier, initial_value, pos)
        } catch(e) {
            throw `while parsing let statement at line ${pos.line}, at column ${pos.column}\n${e}`
        }
    }

    // output ::= "output" expresion ";"
    private parse_output(): OUTPUT {
        const pos = this.buffer.exclude_pos()
        try {
            const expression = this.parse_expression()
            this.buffer.required(';')
            return OUTPUT(expression, pos)
        }
        catch(e) {
            throw `while parsing output statement at line ${pos.line}, at column ${pos.column}\n${e}`
        }
    }

    // expression_statement ::= expression ";"
    private parse_expression_statement(): EXPRESSION_STATEMENT {
        const pos = this.buffer.peek_pos()
        try {
            const expression = this.parse_expression()
            this.buffer.required(';')
            return EXPRESSION_STATEMENT(expression, pos)
        } catch(e) {
            throw `while parsing expression at line ${pos.line}, at column ${pos.column}\n${e}`
        }
    }

    // statement_list ::= "{" statement* "}"
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

    // the most high-lever expression is assign
    // and the thing is -- assign has RIGHT precedence
    // while rest of the operators have LEFT precedence
    private parse_expression(): EXPRESSION {
        let result = this.parse_or()
        if(this.buffer.maybe('=')) { // it parses assign
            if(result.type !== 'variable') 
                throw `expected identifier in assignment, found ${result.type} node`
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

    // primary ::= ("-" | "not") primary | "(" expression ")" | number | variable
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

        if(this.buffer.maybe('true')) {
            return {
                type: 'number',
                value: 1
            }
        }

        if(this.buffer.maybe('false')) {
            return {
                type: 'number',
                value: 0
            }
        }

        switch(this.buffer.peek_type()) {
            case 'identifier': return {
                type: 'variable', 
                identifier: this.buffer.next()!.span
            }
            case 'number': return {
                type: 'number',
                value: Number(this.buffer.next()!.span)
            }

            default: 
            throw `expected identifier or number while parsing primary expression, found ${format(this.buffer.next())}`
        }
    }

    // parses LEFT precedence ops
    // like operation ::= (more-low-level) "[some-operator]" (more-low-level)
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