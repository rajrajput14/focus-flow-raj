import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an AI productivity assistant. Generate an optimal daily plan for the user.
    
Return a JSON object with:
- tasks: Array of 3-5 priority tasks with {title, priority, description}
- habits: Array of 2-3 suggested habits for today
- focusWindows: Array of 2-3 optimal focus time windows (e.g., "9:00 AM - 11:00 AM: Deep Work")

Keep it concise and actionable.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a productivity planning assistant.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_daily_plan',
            parameters: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                      description: { type: 'string' }
                    }
                  }
                },
                habits: { type: 'array', items: { type: 'string' } },
                focusWindows: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_daily_plan' } }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI API error:', response.status, text);
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    const plan = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});