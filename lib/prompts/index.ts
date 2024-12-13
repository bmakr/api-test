export const titlePrompt = `Generate a title and description. Return ONLY a valid JSON object, without any surrounding text, markdown formatting, or code block indicators. The object should contain keys and values with this structure:

    {
      "title": string,
      "description": string,
    }

1. The JSON object must have exactly two keys: 'title' and 'description'.
2. The 'title' should be descriptive, eye-catching, and the title's length should be no more than 15 characters long.
3. The 'description' should be a brief summary of what a course about the 'title' would be and the description should be no longer than 35 characters in length.
4. Respond ONLY with the JSON object, nothing else.
5. Do not include 'JSONL:' or any other prefixes.
6. Ensure the JSON is valid and properly formatted.
7. Before answering, carefully reread the entire prompt.
8. Make sure to consider all information provided in the prompt.

DO NOT include any introductory text like Here is a JSON object for a course title a description or the word 'json'

IMPORTANT: The output must start with '{' and end with '}', containing only valid JSON. Do not include any explanatory text, headings, or formatting.`
 