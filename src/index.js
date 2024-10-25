const { bot, notifyUserAboutTask, isActive, selectedCategories } = require('./bot/bot');
const { parseYuduTasks } = require('./parsers/yuduParser');
const config = require('./config');

async function checkForNewTasks() {
    if (isActive && selectedCategories.length > 0) {
        const tasks = await parseYuduTasks(selectedCategories);
        tasks.forEach(task => notifyUserAboutTask(task));
    }
}

setInterval(checkForNewTasks, config.pollInterval);

console.log('Бот запущен...');