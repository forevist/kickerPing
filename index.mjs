import { Telegraf } from 'telegraf';
import fs from 'fs';
import { parseGames } from './parser.mjs';

const BOT_TOKEN = '';
const bot = new Telegraf(BOT_TOKEN);

const USERS_FILE = './storage.json';
let users = {};

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Сохраняем пользователей
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}


bot.start((ctx) => {
  ctx.reply(
    'Привет! Чтобы получать уведомления, зарегистрируйся:\n\n' +
    '\/register <Две буквы имени. Фамилия>\n\n' +
    'Например:\n/register Al. Samsonov'
  );
});
// Команда регистрации
// bot.on('text', async (ctx) => {
bot.command('register', (ctx) => {
  // const teamName = ctx.message.text;
  const teamName = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!teamName) {
    ctx.reply('Пожалуйста, укажи название команды. Пример:\n/register Al. Samsonov');
    return;
  }
  users[teamName.toLowerCase()] = ctx.chat.id;
  saveUsers();
  ctx.reply(`"${teamName}" зарегистрирован!`);
});

// Проверка и рассылка
let notifiedGames = new Set();

async function checkNewGames() {
  const games = await parseGames();
  for (const game of games) {
    const [table, category, team1, team2] = game;
    let usersName = [];
    Object.keys(users).forEach(user => {
      if (team1.toLowerCase().includes(user.toLowerCase()) || team2.toLowerCase().includes(user.toLowerCase())) {
        usersName.push(user.toLowerCase());
      }
    })
    if (!usersName.length) {
      continue;
    }
    const key = `${category}|${table}|${team1}|${team2}`;
    usersName.forEach((userName) => {
      if (!notifiedGames.has(key)) {
        const chatId = users[userName];
        try {
          bot.telegram.sendMessage(chatId, `Вы играете категорию "${category}" на столе ${table} \n ${team1} vs ${team2}`);
          console.log(`${userName} уведомлен`)
        } catch (e) {
          console.log(e);
        }
      }
    })
    notifiedGames.add(key);
  }
}

// checkNewGames();
setInterval(checkNewGames, 5 * 1000);

bot.launch();
console.log('Бот запущен');


