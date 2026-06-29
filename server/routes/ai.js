import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const ai = new GoogleGenAI({}); // Automatically uses process.env.GEMINI_API_KEY

// Helper to get workspace root (assuming server runs from FileVault root)
const WORKSPACE_ROOT = process.cwd();

// --- Tool Definitions for Gemini ---
const tools = [
  {
    functionDeclarations: [
      {
        name: 'listDirectory',
        description: 'Lists all files and folders in a specific directory path relative to the workspace root.',
        parameters: {
          type: 'OBJECT',
          properties: {
            dirPath: {
              type: 'STRING',
              description: 'The relative path to the directory (e.g., "." for root, "src/components" for a subfolder).'
            }
          },
          required: ['dirPath']
        }
      },
      {
        name: 'searchFiles',
        description: 'Search for files by name or extension in the workspace.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search term (e.g., "index", ".jsx", "report").'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'prepareFileDeletion',
        description: 'Prepares files for deletion. Use this when the user asks to delete files. This will trigger a manual confirmation prompt on the user\'s screen.',
        parameters: {
          type: 'OBJECT',
          properties: {
            paths: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of absolute or relative file paths to delete.'
            },
            reason: {
              type: 'STRING',
              description: 'Reason for deletion to show to the user.'
            }
          },
          required: ['paths', 'reason']
        }
      }
    ]
  }
];

// Helper functions for the tools
function executeTool(call) {
  const name = call.name;
  const args = call.args;

  try {
    if (name === 'listDirectory') {
      const targetPath = path.join(WORKSPACE_ROOT, args.dirPath || '.');
      if (!fs.existsSync(targetPath)) return { error: 'Directory not found' };
      const items = fs.readdirSync(targetPath, { withFileTypes: true });
      const result = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'folder' : 'file',
        path: path.join(args.dirPath || '.', item.name)
      }));
      return { items: result };
    } 
    else if (name === 'searchFiles') {
      // Simple recursive search
      const results = [];
      const search = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          const relPath = path.relative(WORKSPACE_ROOT, fullPath);
          // ignore node_modules
          if (item.name === 'node_modules' || item.name === '.git') continue;
          
          if (item.name.toLowerCase().includes(args.query.toLowerCase())) {
            results.push({ name: item.name, path: relPath, type: item.isDirectory() ? 'folder' : 'file' });
          }
          if (item.isDirectory()) {
            search(fullPath);
          }
        }
      };
      search(WORKSPACE_ROOT);
      return { results: results.slice(0, 50) }; // limit to 50
    }
    else if (name === 'prepareFileDeletion') {
      // We don't actually delete here. We just return a status so the AI knows it succeeded in proposing it.
      return { status: 'pending_user_confirmation', proposedPaths: args.paths, reason: args.reason };
    }
    return { error: 'Unknown tool' };
  } catch (error) {
    return { error: error.message };
  }
}


router.post('/summarize', async (req, res) => {
  try {
    const { content, fileName } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `Please provide a concise summary of the following file named "${fileName}". Highlight the main points or purpose of the file.\n\nFile Content:\n${content.substring(0, 8000)}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// We need to keep track of chat history per session. For simplicity in this demo, we'll keep a global memory or pass history from frontend.
// Passing history from frontend is better for stateless backend.
router.post('/chat', async (req, res) => {
  try {
    const { history, message } = req.body; // history should be array of {role: 'user'|'model', parts: [{text}]}

    // Construct the chat session
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are the FileVault AI Assistant. You help the user manage their local files. You can search for files and list directories. If the user asks to delete files, use the prepareFileDeletion tool to propose it to them (do not say you deleted it, say you have prepared them for deletion and ask them to click the confirmation button). Be concise and helpful.",
        tools: tools,
        temperature: 0.2,
      },
      history: history || []
    });

    let response = await chatSession.sendMessage({ message: message });
    
    // Handle function calling loop
    const toolCallsMade = [];
    
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionResponses = [];
      
      for (const call of response.functionCalls) {
        const result = executeTool(call);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: result
          }
        });
        
        // If it was a deletion proposal, we want to save this info to send to the frontend UI
        if (call.name === 'prepareFileDeletion') {
          toolCallsMade.push({
            type: 'deletion_proposal',
            paths: call.args.paths,
            reason: call.args.reason
          });
        }
      }
      
      response = await chatSession.sendMessage({ message: functionResponses });
    }

    res.json({ 
      text: response.text, 
      history: await chatSession.getHistory(),
      actions: toolCallsMade // Send any special actions for the frontend to render UI components
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const aiRoutes = router;
