const formula = 'y ~ x1 * x2 * x3';
console.log('Testing formula:', formula);

// Simulate the parsing logic
const parts = formula.split('~');
const response = parts[0].trim();
const predictors_str = parts[1].trim();

console.log('Response:', response);
console.log('Predictors string:', predictors_str);

const predictors = ['(Intercept)'];
for (const term of predictors_str.split('+')) {
  const trimmed = term.trim();
  if (trimmed === '1' || trimmed === '') continue;
  
  if (trimmed.includes('*')) {
    const interaction_vars = trimmed.split('*').map(s => s.trim()).filter(s => s !== '');
    console.log('Interaction vars:', interaction_vars);
    
    // Add main effects
    for (const var of interaction_vars) {
      if (!predictors.includes(var)) {
        predictors.push(var);
      }
    }
    
    // Add interaction
    const interaction = interaction_vars.join(':');
    predictors.push(interaction);
  } else {
    predictors.push(trimmed);
  }
}

console.log('Final predictors:', predictors);
