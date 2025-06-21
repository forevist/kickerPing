import { Telegraf } from 'telegraf';
import { parseGames } from './parser.mjs';
import dotenv from 'dotenv';
import { getAllUsers, registerUser } from './db.mjs';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN не указан в .env');
  process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);

// инициализация списка пользователей (пока так)
let users = getAllUsers();
let URL;

const ADMINS = process.env.ADMINS;
function isAdmin(ctx) {
  return ADMINS.includes(ctx.from.id);
}

// описание хэлп мессаджа
bot.start((ctx) => {
  if (!isAdmin(ctx)) {
    ctx.reply(
      'Привет! Чтобы получать уведомления, зарегистрируйся:\n\n' +
      '\/register <Две буквы имени. Фамилия>\n\n' +
      'Например:\n/register Al. Samsonov'
    );
    return;
  }
  
  ctx.reply(
    'Привет! Чтобы получать уведомления, зарегистрируйся:\n\n' +

    '\/register <Две буквы имени. Фамилия>\n\n' +
    'Например:\n/register Al. Samsonov\n\n' +
    'Так как ты админ, то можешь запустить парсинг на свой турнир \n\n' +

    '\/set_tournament <ID>\n\n' +
    'Например:\n/set_tournament 123456\n\n' +

    '\/start_parser - запустит обработку игр\n\n' +

    '\/stop_parser - остановит обработку игр (пожалуйста останови прасинг после окончания игрового дня)'
  );
  
});

// Команда регистрации
bot.command('register', (ctx) => {
  const playerName = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!playerName) {
    ctx.reply('Пожалуйста, укажи название команды. Пример:\n/register Al. Samsonov');
    return;
  }
  registerUser(ctx.chat.id, playerName.toLowerCase())
  users = getAllUsers();
  ctx.reply(`"${playerName}" зарегистрирован!`);
});

// команды админа
bot.command('set_tournament', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Нет доступа');
  
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Укажи ID турнира: /set_tournament 123');
  
  URL = `https://rtsf.ru/fast/tournament/players_station/get_launched_matchs_html.jsp?tournamentId=${id}&originalTournamentId=0&lang=ru&playerId=0&barCode=null&nocache=1749387112229`;
  
  ctx.reply(`ID турнира установлен: ${id}`);
});

bot.command('start_parser', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Нет доступа');
  
  ctx.reply('Парсинг запущен');
  startParsing();
});

bot.command('stop_parser', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('Нет доступа');
  
  ctx.reply('Парсинг остановлен');
  stopParsing();
});



// Проверка и рассылка
let notifiedGames = new Set();
async function checkNewGames() {
  console.log('checkNewGames');
  const games = await parseGames(URL);
  for (const game of games) {
    const [table, category, team1, team2] = game;
    let chatIDs = [];
    users.forEach(user => {
      if (team1.toLowerCase().includes(user.player_name) || team2.toLowerCase().includes(user.player_name)) {
        chatIDs.push(user.chat_id);
      }
    })
    
    if (!chatIDs.length) {
      continue;
    }
    const key = `${category}|${table}|${team1}|${team2}`;
    chatIDs.forEach((chatId) => {
      if (!notifiedGames.has(key)) {
        try {
          bot.telegram.sendMessage(chatId, `Вы играете категорию "${category}" на столе ${table} \n ${team1} vs ${team2}`);
        } catch (e) {
          console.log(e);
        }
      }
    })
    notifiedGames.add(key);
  }
}

let parsing = false;
let intervalId;
function startParsing() {
  if (parsing) return;
  parsing = true;
  intervalId = setInterval(checkNewGames, 5000);
}
function stopParsing() {
  if (!parsing) return;
  parsing = false;
  clearInterval(intervalId);
}

bot.launch();
console.log('Бот запущен');


