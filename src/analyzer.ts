import { EXPRESSION, PROGRAM, STATEMENT } from "./nodes";

class AnalyzerScope {
    private variables: Set<string> = new Set

    constructor(private readonly parent?: AnalyzerScope) {}

    public is_initialized(id: string): boolean {
        return this.variables.has(id) || Boolean(this.parent?.is_initialized(id))
    }

    public initialize(id: string): void {
        if(this.variables.has(id))
            throw `variable "${id}" has been initialized multiple times`
        this.variables.add(id)
    }

    public child(): AnalyzerScope {
        return new AnalyzerScope(this)
    }
}

// making sure all the variables are used after the initialization
export function Analyzer(program: PROGRAM): void {

    function analyze_statement_list(list: STATEMENT[], scope: AnalyzerScope): void {
        list.forEach(statement => analyze_statement(statement, scope))
    }

    function analyze_statement(statement: STATEMENT, scope: AnalyzerScope): void {
        try {
            switch(statement.type) {
                case 'let':
                    if(statement.initial_value)
                        analyze_expression(statement.initial_value, scope)
                    scope.initialize(statement.identifier)
                break
    
                case 'expression-statement':
                    analyze_expression(statement.expression, scope)
                break
    
                case 'output': 
                    analyze_expression(statement.expression, scope)
                break
    
                case 'if':
                    analyze_expression(statement.condition, scope)
                    analyze_statement_list(statement.body, scope.child())
                    if(statement.else) 
                        analyze_statement_list(statement.else, scope.child())
                break
    
                case 'loop':
                    analyze_expression(statement.condition, scope)
                    analyze_statement_list(statement.body, scope.child())
                break
            }
        } catch(e) {
            throw `in ${statement.type} node (at line ${statement.line}, at column ${statement.column})\n${e}`
        }
    }

    function analyze_expression(expression: EXPRESSION, scope: AnalyzerScope): void {
        switch(expression.type) {
            case 'variable':
                if(!scope.is_initialized(expression.identifier))
                    throw `variable "${expression.identifier}" has been used before initialization`
            break

            case 'binary':
                analyze_expression(expression.left, scope)
                analyze_expression(expression.right, scope)
            break

            case 'in-brackets': 
                analyze_expression(expression.expression, scope)
            break

            case 'unary-operation':
                analyze_expression(expression.expression, scope)
            break

            case 'number':
            break
        }
    }

    try {
        analyze_statement_list(program, new AnalyzerScope)
    } catch(e) {
        throw `Analyzer error:\n${e}`
    }
}