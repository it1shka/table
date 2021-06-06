// So i started creating my parser 
// from definig shape of my AST
// -- from defining types of AST nodes

export type PROGRAM = 
    | STATEMENT[]

export type STATEMENT = 
    | IF 
    | LOOP 
    | LET 
    | OUTPUT
    | EXPRESSION_STATEMENT

// each of STATEMENT nodes will
// be provided with additional information 
// about the position of the entry 
// token (the first token in the node)
// or, simply, position of the node

export interface NodeEntry {
    line: number
    column: number
}

// STATEMENT nodes

export type IF = 
    | {
        type: 'if'
        condition: EXPRESSION
        body: STATEMENT[]
        else?: STATEMENT[]
    } & NodeEntry

export type LOOP = 
    | {
        type: 'loop'
        condition: EXPRESSION
        body: STATEMENT[]
    } & NodeEntry

export type LET = 
    | {
        type: 'let'
        identifier: string
        initial_value?: EXPRESSION
    } & NodeEntry

export type OUTPUT = 
    | {
        type: 'output'
        expression: EXPRESSION
    } & NodeEntry

export type EXPRESSION_STATEMENT = 
    | {
        type: 'expression-statement'
        expression: EXPRESSION
    } & NodeEntry

// EXPRESSION nodes

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

// functions for creating AST nodes 

export function IF(
    condition: EXPRESSION,
    body: STATEMENT[],
    else_body: STATEMENT[] | undefined,
    pos: NodeEntry
): IF {
    return {
        type: 'if',
        condition,
        body,
        else: else_body,
        ...pos
    }
}

export function LOOP (
    condition: EXPRESSION,
    body: STATEMENT[],
    pos: NodeEntry
): LOOP {
    return {
        type: 'loop',
        condition,
        body,
        ...pos
    }
}

export function LET (
    identifier: string,
    initial_value: EXPRESSION | undefined,
    pos: NodeEntry
): LET {
    return {
        type: 'let',
        identifier,
        initial_value,
        ...pos
    }
}

export function OUTPUT (
    expression: EXPRESSION,
    pos: NodeEntry
): OUTPUT {
    return {
        type: 'output',
        expression,
        ...pos
    }
}

export function EXPRESSION_STATEMENT(
    expression: EXPRESSION,
    pos: NodeEntry
): EXPRESSION_STATEMENT {
    return {
        type: 'expression-statement',
        expression,
        ...pos
    }
}