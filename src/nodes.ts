// So i started creating my parser 
// from definig shape of my AST
// -- from defining types of AST nodes

export type PROGRAM = 
    | STATEMENT[]

export type STATEMENT = 
    | IF 
    | LOOP 
    | LET 
    | EXPRESSION
    | OUTPUT 

export type IF = 
    | {
        type: 'if'
        condition: EXPRESSION
        body: STATEMENT[]
        else?: STATEMENT[]
    }

export type LOOP = 
    | {
        type: 'loop'
        condition: EXPRESSION
        body: STATEMENT[]
    }

export type LET = 
    | {
        type: 'let'
        identifier: string
        initial_value: EXPRESSION
    }

export type OUTPUT = 
    | {
        type: 'output'
        expression: EXPRESSION
    }

export type EXPRESSION = 
    | BINARY 
    | PRIMARY

export type BINARY = 
    | {
        type: 'binary'
        operator: BINARY_OPERATOR
        left: EXPRESSION
        right: EXPRESSION
    }

export type BINARY_OPERATOR = 
    | '='
    | 'or'
    | 'and'
    | '=='
    | '!='
    | '<'
    | '>'
    | '<='
    | '>='
    | '+'
    | '-'
    | '*'
    | '/'
    | 'mod'

export type PRIMARY = 
    | UNARY_OPERATION
    | IN_BRACKETS
    | VALUE

export type UNARY_OPERATION = 
    | {
        type: 'unary-operation'
        operator: UNARY_OPERATOR
        expression: PRIMARY
    }

export type UNARY_OPERATOR = 
    | '-'
    | 'not'

export type IN_BRACKETS = 
    | {
        type: 'in-brackets'
        expression: EXPRESSION
    }

export type VALUE = 
    | NUMBER 
    | VARIABLE

export type NUMBER = 
    | {
        type: 'number'
        value: string
    }

export type VARIABLE = 
    | {
        type: 'variable'
        identifier: string
    }

/*
interface Position {
    line: number
    column: number
}
*/

// and here I want to create
// multiple functions 
// to create nodes conveniently

// one function 
// per each node type

export function IF(
    condition: EXPRESSION,
    body: STATEMENT[],
    else_body?: STATEMENT[]
): IF {
    return {
        type: 'if',
        condition,
        body,
        else: else_body
    }
}

export function LOOP(
    condition: EXPRESSION,
    body: STATEMENT[]
): LOOP {
    return {
        type: 'loop',
        condition,
        body
    }
}

export function LET (
    identifier: string,
    initial_value: EXPRESSION
): LET {
    return {
        type: 'let',
        identifier,
        initial_value
    }
}

export function OUTPUT (
    expression: EXPRESSION
): OUTPUT {
    return {
        type: 'output',
        expression
    }
}

