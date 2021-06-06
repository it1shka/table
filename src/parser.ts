import { Token } from "./lexer";
import { EXPRESSION, IF, LET, LOOP, OUTPUT, PROGRAM, STATEMENT } from "./nodes";

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

    public peek_type(): string | undefined {
        return this.peek()?.type
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
        if( (next = this.next()?.span) !== span)
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
        switch(this.buffer.peek_type()) {
            case 'if':      return this.parse_if()
            case 'loop':    return this.parse_loop()
            case 'let':     return this.parse_let()
            case 'output':  return this.parse_output()
            default:        return this.parse_expression()
        }
    }

    private parse_if(): IF {
        const pos = this.buffer.exclude_pos()
        const condition = this.parse_statement()
        const body = this.parse_statement_list()
        let else_body = undefined
        if(this.buffer.maybe('else'))
            else_body = this.parse_statement_list()
        
    }

    private parse_loop(): LOOP {

    }

    private parse_let(): LET {

    }

    private parse_output(): OUTPUT {

    }

    private parse_expression(): EXPRESSION {

    }

    private parse_statement_list(): STATEMENT[] {

    }
}