export async function getCurrentWeather(location) {
  console.log(`Getting current weather for ${location}`);

  const weather = {
      temperature: "72",
      unit: "F",
      forecast: "sunny"
  }
  return JSON.stringify(weather)
}

export async function getLocation() {
  return "Salt Lake City, UT"
}