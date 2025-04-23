import { openai } from './config.js';
import { getCurrentWeather, getLocation } from "./tools"

/**
 * Goal - build an agent that can get the current weather at my current location
 * and give me some localized ideas of activities I can do.
 */

const weather = await getCurrentWeather()
const location = await getLocation()

const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
        {
            role: "user",
            content: `Give me a list of activity ideas based on my current location of ${location} and weather of ${weather}`
        }
    ]
})

console.log(response.choices[0].message.content)