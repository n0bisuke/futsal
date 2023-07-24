const BASE_URL = `https://labola.jp/reserve/events/search/personal/area-13/`;

const json = fetch(BASE_URL);

json.then((response) => {
  return response.json();
}).then((jsonData) => {
  console.log(jsonData);
});