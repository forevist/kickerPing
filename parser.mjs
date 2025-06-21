import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const URL = 'https://rtsf.ru/fast/tournament/players_station/get_launched_matchs_html.jsp?tournamentId=84455&originalTournamentId=0&lang=ru&playerId=0&barCode=null&nocache=1749387112229';

export async function parseGames() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const innerTable = $('table table').first();
  const rows = innerTable.find('tr');
  const games = [];
  
  rows.each((i, row) => {
    const cols = $(row).find('td');
    if (cols.length >= 7) {
      const table = $(cols[0]).text().trim();
      const category = $(cols[4]).text().trim();
      const team1 = $(cols[6]).text().trim();
      const team2 = $(cols[8]).text().trim();

      games.push([table, category, team1, team2]);
    }
  });
  
  return games;
}