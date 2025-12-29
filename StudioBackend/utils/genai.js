import { GoogleGenAI } from '@google/genai';
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
});

export async function generateSchedule(shifts, staff) {
          if (!Array.isArray(shifts) || !Array.isArray(staff)) {
                    throw new Error('Invalid input: shifts and staff arrays are required');
          }

          const modelId = 'gemini-2.5-flash';

          const prompt = `
    You are an expert studio manager and scheduler. Your task is to assign Hosts to a list of pre-defined shift slots for the month.

    The shifts provided are individual slots. There are exactly 3 slots per day: Morning, Day, and Evening.

    **Inputs:**
    1. Shift Slots to Fill: ${JSON.stringify(
                    shifts.map(({ id, date, startTime, endTime, role }) => ({
                              id,
                              date,
                              time: `${startTime}-${endTime}`,
                              role,
                    }))
          )}
    2. Hosts Available: ${JSON.stringify(
                    staff.map(({ id, name, role, constraints }) => ({
                              id,
                              name,
                              role,
                              constraints,
                    }))
          )}

    **Rules & Constraints:**
    1. **No Overlaps**: A Host cannot work two shift slots that overlap in time.
    2. **3 Staff Per Day**: The studio prefers to assign **3 different people** for the 3 daily slots (Morning, Day, Evening). Avoid giving one person multiple shifts in a single day unless strictly necessary due to lack of availability.
    3. **Strict Constraint Adherence**: You MUST follow the natural language constraints provided for each staff member (e.g., "no weekends", "max 20 hours", "only Tuesday mornings").
    4. **Minimum Workload**: Ensure every staff member is assigned at least 2 shifts per week (7-day period), provided their constraints allow it. This is a priority.
    5. **Fairness**: Distribute the total hours as evenly as possible among eligible staff.
    6. **Unfilled Shifts**: If a shift slot cannot be filled by ANY host due to valid constraints, add its ID to the 'unfilledShiftIds' list.

    **Output Goal:**
    Produce a valid schedule maximizing coverage and preference for splitting the day among 3 different staff.
  `;

          const responseSchema = {
                    type: 'object',
                    properties: {
                              assignments: {
                                        type: 'array',
                                        items: {
                                                  type: 'object',
                                                  properties: {
                                                            shiftId: { type: 'string' },
                                                            staffId: { type: 'string' },
                                                            reasoning: { type: 'string' },
                                                  },
                                                  required: ['shiftId', 'staffId'],
                                        },
                              },
                              unfilledShiftIds: {
                                        type: 'array',
                                        items: { type: 'string' },
                              },
                              notes: { type: 'string' },
                    },
                    required: ['assignments', 'unfilledShiftIds', 'notes'],
          };

          try {
                    const response = await genAI.models.generateContent({
                              model: modelId,
                              contents: prompt,
                              config: {
                                        responseMimeType: 'application/json',
                                        responseSchema,
                                        thinkingConfig: { thinkingBudget: 2048 },
                              },
                    });

                    const text = response.text;
                    if (!text) throw new Error('No response from Gemini');

                    return JSON.parse(text);
          } catch (err) {
                    console.error('GenAI error:', err);
                    throw err;
          }
}
