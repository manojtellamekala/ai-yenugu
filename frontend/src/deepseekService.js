// src/deepseekService.js
import { HfInference } from '@huggingface/inference';

// Initialize with your Hugging Face token
const hf = new HfInference(import.meta.env.VITE_HF_TOKEN);

export async function queryDeepSeek(messages) {
  try {
    const response = await hf.textGeneration({
      model: "deepseek-ai/DeepSeek-V3",
      inputs: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
      parameters: {
        max_new_tokens: 200,
        return_full_text: false
      }
    });
    return response.generated_text;
  } catch (error) {
    console.error("Error querying DeepSeek:", error);
    throw error;
  }
}