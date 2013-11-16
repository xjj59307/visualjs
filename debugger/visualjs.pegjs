start
    = __ program:program __ { return program; } 

program
    = elements:rules? { return elements !== '' ? elements : []; }

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
    / characters:[0-9A-Za-z]

reserved_word
    = (
        pattern_token
        / action_token
        / create_token
        / next_token
        / exec_token
        / when_token
      )
      ! identifier_name

pattern_token = 'pattern' !identifier_part
action_token = 'action' !identifier_part
create_token = 'create' !identifier_part
next_token = 'next' !identifier_part
exec_token = 'exec' !identifier_part
when_token = 'when' !identifier_part

__
    = [ \t\n\r]*

rules
    = head:rule tail:(__ rule)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[1]);
            return previous;
        }, [head]);
    }

rule
    = pattern

pattern
    = name:identifier __ ':' __ pattern_token __
    '{' __ match_clauses:match_clauses __ '}' {
        return {
            type: 'pattern',
            name: name,
            match_clauses: match_clauses
        };
    }

match_clauses
    = head:match_clause tail:(__ ',' __ match_clause)* {
        return tail.reduce(function(previous, current) {
            previous.push(current[3]);
            return previous;
        }, [head]);
    }

match_clause
    = exec_token __ name:identifier __ condition:when_clause? {
        return {
            type: 'match_clause',
            name: name,
            condition: condition 
        };
    }

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
