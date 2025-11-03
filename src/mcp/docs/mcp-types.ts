export interface DocEntry {
  name: string;
  category: string;
  signature: string;
  description: string;
  imports?: string[];
  parameters?: string[];
  returns?: string;
  examples?: string[];
  related?: string[];
  antiPatterns?: string[];
  bestPractices?: string[];
}
