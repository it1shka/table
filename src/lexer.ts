// defining all token types 
// that will be produced by our lexer
type TokenType = 
    | 'number'
    | 'identifier'
    | 'keyword'
    | 'punctuation'
    | 'operator'

// all the language keywords
const Keywords = [
    'if', 'else', 'loop', 'let', 'output'
]

// all the punctuation
// and I used a backslash here to treat symbols 
// as usual while dynamically creating 
// regular expressions
const Punctuation = [
    '\\{', '\\}', '\\(', '\\)', ';'
]

// all the operators
const Operators = [
    'or', 'and', '==', '=', '!=', '<=', 
    '>=', '<', '>', '\\+', '\\-', '\\*', '/', 'mod', 'not'
]

// the pattern object containing multiple 
// regexps for parser
// I used Record<T, U> type here 
// to be sure that for every TokenType 
// there is a corresponding RegExp pattern
// as well as for whitespace and comment since they
// won't be put to the output Token[] array
const Patterns: Record<(TokenType|'whitespace'|'comment'), RegExp> = {
    number:     /^(\d*\.)?\d+/,
    identifier: /^[_a-zA-Z]+[_a-zA-Z0-9]*/,
    keyword:    new RegExp(`^(${Keywords.join('|')})`),
    punctuation: new RegExp(`^(${Punctuation.join('|')})`),
    operator:   new RegExp(`^(${Operators.join('|')})`),
    comment:    /^#.*/,
    whitespace: /^\s+/,
}

// interface Token defines shape of 
// token object as well as provides additional
// information about token position
// in the program. It will be used 
// from parser and semantic analyser to 
// catch errors and set node entries
export interface Token {
    type: TokenType
    span: string
    line: number
    column: number
}

export class Lexer {
    private line = 1
    private column = 1
    private code_lines: string[]

    constructor(input: string) {
        // I split the input code by lines
        // to keep track of line number
        this.code_lines = input.split(/\r?\n/)
    }

    private next_line(): void {
        this.line++
        this.column = 1
    }

    private err(content: string): never {
        throw `Lexer error: ${content} (at line ${this.line}, at column ${this.column})`
    }

    public tokenize(): Token[] {
        const tokens: Token[] = []
        const token: (type: TokenType, span: string) => void = 
            (type, span) => {
                tokens.push({
                    type, span,
                    line: this.line,
                    column: this.column
                })
            }
        
        //for every line of code, 
        for(let line of this.code_lines) {

            const move = (len: number) => {
                this.column += len
                line = line.slice(len)
            }

            while(line.length > 0) {
                let match

                // if we have whitespace or comment,
                // we just skip them
                if(match = (Patterns.whitespace.exec(line) 
                    || Patterns.comment.exec(line))) {
                        move(match[0].length)
                }

                // otherwise, we put our token to the output 
                // array and slice the line string 
                else if(match = Patterns.keyword.exec(line)) {
                    const chunk = match[0]
                    token('keyword', chunk)
                    move(chunk.length)
                }

                else if(match = Patterns.number.exec(line)) {
                    const chunk = match[0]
                    token('number', chunk)
                    move(chunk.length)
                }

                else if(match = Patterns.identifier.exec(line)) {
                    const chunk = match[0]
                    token('identifier', chunk)
                    move(chunk.length)
                }

                else if(match = Patterns.punctuation.exec(line)) {
                    const chunk = match[0]
                    token('punctuation', chunk)
                    move(chunk.length)
                }

                else if(match = Patterns.operator.exec(line)) {
                    const chunk = match[0]
                    token('operator', chunk)
                    move(chunk.length)
                }

                else this.err(`unable to tokenize input from character "${line.charAt(0)}"`)
            }

            this.next_line()
        }

        return tokens
    }
}