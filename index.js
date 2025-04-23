import { openai } from './config.js';
import { getCurrentWeather, getLocation } from "./tools"

/**
 * Goal - build an agent that can answer any questions that might require knowledge about my current location and the current weather at my location.
 */

/**
 * 1)
 * We will start to create a loop and inside this loop we will call our llm again and again
 * with new sets of instructions in each portion of the loop

    PLAN:
    1. Design a well-written ReAct (Reason - Act) prompt
    2. Build a loop for my agent to run in.
    3. Parse any actions that the LLM determines are necessary
    4. End condition - final Answer is given
 */

const systemPrompt = `
  You cycle through Thought, Action, PAUSE, Observation. At the end of the loop you output a final Answer. Your final answer should be highly specific to the observations you have from running
  the actions.
  1. Thought: Describe your thoughts about the question you have been asked.
  2. Action: run one of the actions available to you - then return PAUSE.
  3. PAUSE
  4. Observation: will be the result of running those actions.

  Available actions:
  - getCurrentWeather:
      E.g. getCurrentWeather: Salt Lake City
      Returns the current weather of the location specified.
  - getLocation:
      E.g. getLocation: null
      Returns user's location details. No arguments needed.

  Example session:
  Question: Please give me some ideas for activities to do this afternoon.
  Thought: I should look up the user's location so I can give location-specific activity ideas.
  Action: getLocation: null
  PAUSE

  You will be called again with something like this:
  Observation: "New York City, NY"

  Then you loop again:
  Thought: To get even more specific activity ideas, I should get the current weather at the user's location.
  Action: getCurrentWeather: New York City
  PAUSE

  You'll then be called again with something like this:
  Observation: { location: "New York City, NY", forecast: ["sunny"] }

  You then output:
  Answer: <Suggested activities based on sunny weather that are highly specific to New York City and surrounding areas.>
`

const availableFunctions = {
  "getCurrentWeather": getCurrentWeather,
  "getLocation": getLocation
}


async function agent(query) {

  const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
  ]

  const MAX_ITERATIONS = 5

  const actionRegex = /^Action: (\w+): (.*)$/

  for (let i = 0; i < MAX_ITERATIONS; i++) {

    console.log(`Iteration #${i + 1}`)

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
    })

    const responseText = response.choices[0].message.content
    console.log(responseText)

    messages.push({ role: "assistant", content: responseText })

    // Split the string (into an array of strings) on the newline character ("\n")
    const responseLines = responseText.split("\n")

    // Search through the array of strings for one that has "Action:"
    // regex.test will return true of false if the string we provided matches the regex
    // Example of return -> 'Action: getLocation: null'
    const foundActionLine = responseLines.find(line => actionRegex.test(line))

    if (foundActionLine) {
      // Parse the action (function and parameter) from the string
      const actions = actionRegex["exec"](foundActionLine)

      // Destructuring the array obtained in response from actionRegex.exec(foundActionLine)
      // Example of returned array -> ['Action: getLocation: null', 'getLocation', 'null']
      // we don't need the first element string (so we use a general placeholder for it)
      const [_, action, actionArg] = actions

      console.log(`Calling function ${action} with argument ${actionArg}`)

      if (!availableFunctions.hasOwnProperty(action)) {
        throw new Error(`Unknown action: ${action}: ${actionArg}`)
      }

      // Add an "Obversation" message with the results of the function call
      // Observation is the response that we have when we call the function
      const observation = await availableFunctions[action](actionArg)
      messages.push({ role: "assistant", content: `Observation: ${observation}` })
    } else {
      console.log("Agent finished with task")
      return responseText
    }
  }
}



// const query = "Where am I located?"
const query = "What is the current weather in New York City?"
const response = await agent(query)
console.log(response)



