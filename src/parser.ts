import type {Token} from './lexer'
import { IF, PROGRAM, STATEMENT } from './nodes'

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
}

export class Parser {
    private buffer: TokenBuffer

    constructor(tokens: Token[]) {
        this.buffer = new TokenBuffer(tokens)
    }

    public parse_program(): PROGRAM {
        const statements: PROGRAM = []
        while(!this.buffer.eof())
            statements.push(this.parse_statement())
        return statements
    }


    private parse_statement(): STATEMENT {
        switch(this.buffer.peek()?.span) {
            case 'if': return 
            default: 
        }
    }

    private parse_if(): IF {

    }
}