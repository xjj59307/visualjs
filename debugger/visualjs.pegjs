start
    = __ program:program __ { return program; } 

program
    = pattern:pattern __ actions:actions {
        return {
            type: 'program',
            pattern: pattern,
            actions: actions
        };
    }

identifier
    = !reserved_word name:identifier_name { return name; }

identifier_name
    = start:identifier_start parts:identifier_part* {
        return start + parts.join('');
    }

identifier_start
    = characters:[A-Za-z]

identifier_part
    = identifier_start
    / characters:[0-9]

reserved_word
    = (
        pattern_token
        / action_token
        / create_token
        / next_token
        / exec_token
        / when_token
      )
      !identifier_part

pattern_token = 'pattern' !identifier_part
action_token = 'action' !identifier_part
create_token = 'create' !identifier_part
next_token = 'next' !identifier_part
exec_token = 'exec' !identifier_part
when_token = 'when' !identifier_part

__
    = [ \t\n\r]*

actions
    = head:action tail:(__ action)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[1]);
            return previous;
        }, [head]);
    }

pattern
    = name:identifier __ ':' __ pattern_token __
    '{' __ exec_clauses:exec_clauses __ '}' {
        return {
            type: 'pattern',
            name: name,
            exec_clauses: exec_clauses
        };
    }

exec_clauses
    = head:exec_clause tail:(__ ',' __ exec_clause)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[3]);
            return previous;
        }, [head]);
    }

exec_clause
    = exec_token __ name:identifier __
    '(' __ environment:assignment_expressions? __ ')' __ condition:when_clause? {
        return {
            type: 'exec_clause',
            name: name,
            environment: environment,
            condition: condition 
        };
    }

assignment_expressions
    = head:assignment_expression tail:(__ ',' __ assignment_expression)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[3]);
            return previous;
        }, [head]);
    }

assignment_expression
    = name:identifier __ '=' __ value:non_item_terminator+ {
        return {
            type: 'assignment_expression',
            name: name,
            value: value.join('')
        };
    }

non_item_terminator
    = [^ ,)}]

when_clause
    = when_token __ code:braced {
        return {
            type: 'when_clause',
            code: code.substr(1, code.length - 2)
        };
    } 

braced
    = $('(' (braced / non_parenthesis)* ')') 

non_parenthesis
    = [^()]+

action
    = name:identifier __ ':' __ action_token __
    '{' __ action_clauses:action_clauses __ '}' {
        return {
            type: 'action',
            name: name,
            action_clauses: action_clauses
        };
    }

action_clauses
    = head:action_clause tail:(__ ',' __ action_clause)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[3]);
            return previous;
        }, [head]); 
    }

action_clause
    = create_clause / next_clause

create_clause
    = create_token __ node:(node_assignment_expression / node_expression) __
    '(' __ attributes:assignment_expressions __ ')' {
        return {
            type: 'create_clause',
            node: node,
            attributes: attributes 
        };
    }

node_assignment_expression
    = name:identifier __ '=' __ node_type:node_type {
        return {
            type: 'node_assignment_expression',    
            name: name,
            node_type: node_type
        };
    }

node_expression
    = node_type

next_clause
    = next_token __ object:non_item_terminator+ {
        // Termintor of last line is \n.
        if (object[object.length - 1] === '\n')
            object.length -= 1;
        return {
            type: 'next_clause',
            object: object.join('')
        };
    }

node_type
    = node:(
          'tree_node'
        / 'tree_edge'
      )
    !identifier_part {
        return node;
    }

