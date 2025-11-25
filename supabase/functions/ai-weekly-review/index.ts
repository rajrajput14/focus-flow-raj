import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last week's data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [{ data: tasks }, { data: habits }, { data: pomodoros }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).gte('created_at', weekAgo.toISOString()),
      supabase.from('habit_logs').select('*').eq('user_id', userId).gte('created_at', weekAgo.toISOString()),
      supabase.from('pomodoro_logs').select('*').eq('user_id', userId).gte('created_at', weekAgo.toISOString()),
    ]);

    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
    const totalTasks = tasks?.length || 0;
    const habitLogs = habits?.length || 0;
    const focusSessions = pomodoros?.length || 0;

    const prompt = `Analyze this user's week and provide a review:
- Tasks completed: ${completedTasks} / ${totalTasks}
- Habit check-ins: ${habitLogs}
- Focus sessions: ${focusSessions}

Provide a supportive, insightful review.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a supportive productivity coach.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_review',
            parameters: {
              type: 'object',
              properties: {
                achievements: { type: 'string' },
                struggles: { type: 'string' },
                recommendations: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_review' } }
      }),
    });

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    const review = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(review), {
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