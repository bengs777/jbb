export function getPakasirConfig() {
  const project = process.env.PAKASIR_PROJECT_SLUG;
  const apiKey = process.env.PAKASIR_API_KEY;
  
  // For production, these are required. For dev/demo, we can use placeholders 
  // but it's better to warn the user.
  return { project, apiKey };
}

export const PAKASIR_API_BASE = "https://app.pakasir.com/api";
