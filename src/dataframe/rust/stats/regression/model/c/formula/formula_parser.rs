//! Formula parser implementation

use super::formula_types::{BinaryOperator, Formula, FormulaError, FormulaExpr};

/// Formula parser state
pub struct FormulaParser {
    input: String,
    pos: usize,
    tokens: Vec<Token>,
    token_pos: usize,
}

#[derive(Debug, Clone, PartialEq)]
enum Token {
    Tilde,
    Plus,
    Minus,
    Times,
    Colon,
    Power,
    Divide,
    LParen,
    RParen,
    Variable(String),
    Number(f64),
    Dot,
    Eof,
}

impl FormulaParser {
    pub fn new(input: &str) -> Self {
        Self {
            input: input.to_string(),
            pos: 0,
            tokens: Vec::new(),
            token_pos: 0,
        }
    }

    pub fn parse(&mut self) -> Result<Formula, FormulaError> {
        self.tokenize()?;
        self.parse_formula()
    }

    fn tokenize(&mut self) -> Result<(), FormulaError> {
        let chars: Vec<char> = self.input.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            match chars[i] {
                '~' => self.tokens.push(Token::Tilde),
                '+' => self.tokens.push(Token::Plus),
                '-' => self.tokens.push(Token::Minus),
                '*' => self.tokens.push(Token::Times),
                ':' => self.tokens.push(Token::Colon),
                '^' => self.tokens.push(Token::Power),
                '/' => self.tokens.push(Token::Divide),
                '(' => self.tokens.push(Token::LParen),
                ')' => self.tokens.push(Token::RParen),
                '.' => self.tokens.push(Token::Dot),
                c if c.is_whitespace() => {
                    // Skip whitespace
                }
                c if c.is_alphabetic() || c == '_' => {
                    let mut var = String::new();
                    while i < chars.len()
                        && (chars[i].is_alphanumeric() || chars[i] == '_' || chars[i] == '.')
                    {
                        var.push(chars[i]);
                        i += 1;
                    }
                    i -= 1; // Back up one position
                    self.tokens.push(Token::Variable(var));
                }
                c if c.is_ascii_digit() => {
                    let mut num = String::new();
                    while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') {
                        num.push(chars[i]);
                        i += 1;
                    }
                    i -= 1; // Back up one position
                    if let Ok(val) = num.parse::<f64>() {
                        self.tokens.push(Token::Number(val));
                    } else {
                        return Err(FormulaError::ParseError(format!("Invalid number: {}", num)));
                    }
                }
                c => return Err(FormulaError::InvalidCharacter(c, i)),
            }
            i += 1;
        }

        self.tokens.push(Token::Eof);
        Ok(())
    }

    fn parse_formula(&mut self) -> Result<Formula, FormulaError> {
        let expr = self.parse_expression()?;
        Ok(Formula {
            expr,
            environment: None,
        })
    }

    fn parse_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        self.parse_tilde_expression()
    }

    fn parse_tilde_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        let lhs = self.parse_plus_expression()?;

        if self.peek() == &Token::Tilde {
            self.advance(); // consume ~
            let rhs = self.parse_plus_expression()?;
            Ok(FormulaExpr::Formula(Box::new(lhs), Box::new(rhs)))
        } else {
            Ok(FormulaExpr::Tilde(Box::new(lhs)))
        }
    }

    fn parse_plus_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        let mut left = self.parse_times_expression()?;

        while matches!(self.peek(), Token::Plus | Token::Minus) {
            let op = match self.advance() {
                Token::Plus => BinaryOperator::Plus,
                Token::Minus => BinaryOperator::Minus,
                _ => unreachable!(),
            };
            let right = self.parse_times_expression()?;
            left = FormulaExpr::BinaryOp(Box::new(left), op, Box::new(right));
        }

        Ok(left)
    }

    fn parse_times_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        let mut left = self.parse_colon_expression()?;

        while matches!(self.peek(), Token::Times | Token::Divide) {
            let op = match self.advance() {
                Token::Times => BinaryOperator::Times,
                Token::Divide => BinaryOperator::Divide,
                _ => unreachable!(),
            };
            let right = self.parse_colon_expression()?;
            left = FormulaExpr::BinaryOp(Box::new(left), op, Box::new(right));
        }

        Ok(left)
    }

    fn parse_colon_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        let mut left = self.parse_power_expression()?;

        while self.peek() == &Token::Colon {
            self.advance(); // consume :
            let right = self.parse_power_expression()?;
            left = FormulaExpr::BinaryOp(Box::new(left), BinaryOperator::Colon, Box::new(right));
        }

        Ok(left)
    }

    fn parse_power_expression(&mut self) -> Result<FormulaExpr, FormulaError> {
        let mut left = self.parse_primary()?;

        while self.peek() == &Token::Power {
            self.advance(); // consume ^
            let right = self.parse_primary()?;
            left = FormulaExpr::BinaryOp(Box::new(left), BinaryOperator::Power, Box::new(right));
        }

        Ok(left)
    }

    fn parse_primary(&mut self) -> Result<FormulaExpr, FormulaError> {
        match self.peek() {
            Token::Variable(name) => {
                let name = name.clone();
                self.advance();
                Ok(FormulaExpr::Variable(name))
            }
            Token::Number(val) => {
                let val = *val;
                self.advance();
                Ok(FormulaExpr::Number(val))
            }
            Token::Dot => {
                self.advance();
                Ok(FormulaExpr::Dot)
            }
            Token::LParen => {
                self.advance(); // consume (
                let expr = self.parse_expression()?;
                if self.peek() == &Token::RParen {
                    self.advance(); // consume )
                    Ok(FormulaExpr::Paren(Box::new(expr)))
                } else {
                    Err(FormulaError::MismatchedParentheses)
                }
            }
            _ => Err(FormulaError::UnexpectedToken(
                format!("{:?}", self.peek()),
                self.pos,
            )),
        }
    }

    fn peek(&self) -> &Token {
        if self.token_pos < self.tokens.len() {
            &self.tokens[self.token_pos]
        } else {
            &Token::Eof
        }
    }

    fn advance(&mut self) -> Token {
        if self.token_pos < self.tokens.len() {
            let token = self.tokens[self.token_pos].clone();
            self.token_pos += 1;
            token
        } else {
            Token::Eof
        }
    }
}

/// Parse a formula string into a Formula struct
pub fn parse_formula(input: &str) -> Result<Formula, FormulaError> {
    let mut parser = FormulaParser::new(input);
    parser.parse()
}
