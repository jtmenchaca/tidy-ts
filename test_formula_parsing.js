const formula = 'y ~ x1 * x2 * x3';

// Simulate the parsing logic
const parts = formula.split('~');
const response = parts[0].trim();
const predictors_str = parts[1].trim();


const predictors = ['(Intercept)'];
for (const term of predictors_str.split('+')) {
  const trimmed = term.trim();
  if (trimmed === '1' || trimmed === '') continue;
  
  if (trimmed.includes('*')) {
    const interaction_vars = trimmed.split('*').map(s => s.trim()).filter(s => s !== '');
    
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


