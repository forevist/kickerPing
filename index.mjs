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

// описание хэлп мессаджа
bot.start((ctx) => {
  ctx.reply(
    'Привет! Чтобы получать уведомления, зарегистрируйся:\n\n' +
    '\/register <Две буквы имени. Фамилия>\n\n' +
    'Например:\n/register Al. Samsonov'
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



// Проверка и рассылка
let notifiedGames = new Set();
async function checkNewGames() {
  const games = await parseGames();
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

// checkNewGames();
setInterval(checkNewGames, 5 * 1000);

bot.launch();
console.log('Бот запущен');


