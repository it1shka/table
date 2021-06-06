import {Lexer} from './lexer'

const program = `
#this is a comment
    let a = 5;
    let b = 5;
    output a / b;

    loop a > b {
        output dick;
    }
#this is also
#`

const tokens = new Lexer(program).tokenize()
console.log(tokens)