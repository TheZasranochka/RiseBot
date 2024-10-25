const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const { parseYuduTasks } = require('../parsers/yuduParser');

const bot = new TelegramBot(config.telegramToken, { polling: true });
let isActive = false;
let chatIds = [];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (!chatIds.includes(chatId)) {
        chatIds.push(chatId);
    }

    bot.sendMessage(chatId, 'Бот автоотклика запущен!', {
        reply_markup: {
            keyboard: [
                ['Старт / Стоп'],
                ['Статус'],
                ['Выбор категорий']
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (!chatIds.includes(chatId)) {
        chatIds.push(chatId);
    }

    switch (msg.text) {
        case 'Старт / Стоп':
            isActive = !isActive;
            await bot.sendMessage(chatId, isActive ? 'Бот активирован' : 'Бот остановлен');
            break;
        case 'Статус':
            await bot.sendMessage(chatId, `Бот сейчас ${isActive ? 'работает' : 'остановлен'}.`);
            break;
        case 'Выбор категорий':
            await bot.sendMessage(chatId, 'Выберите категории:', {
                reply_markup: {
                    keyboard: [
                        ['Сохранить и перезагрузить']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
            break;
        case 'Сохранить и перезагрузить':
            await bot.sendMessage(chatId, 'Бот перезагружается...');
            require('child_process').exec('pm2 restart RiseTestBot1', (err, stdout, stderr) => {
                if (err) {
                    console.error(`Ошибка при перезапуске: ${stderr}`);
                    return;
                }
                console.log(`Бот перезапущен: ${stdout}`);
            });
            break;
        default:
            await bot.sendMessage(chatId, 'Пожалуйста, используйте кнопки для взаимодействия.');
            break;
    }
});

async function notifyUserAboutTask(task) {
    try {
        for (const chatId of chatIds) {
            await bot.sendMessage(chatId, `Новое задание: ${task.title}\nОписание: ${task.description}\nСсылка: ${task.link}`);
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error.message);
    }
}

module.exports = { bot, notifyUserAboutTask, isActive };