const { parseYuduTasks, authorizeAndSaveCookies, sendAutoReply, checkIfCookiesExist } = require('./parsers/yuduParser');
const { notifyUserAboutTask } = require('./bot/bot');
const config = require('./config');

// Функция для проверки новых заданий
async function checkForNewTasks() {
    try {
        const tasks = await parseYuduTasks();
        if (tasks.length === 0) {
            console.log('Нет новых заданий.');
        } else {
            for (const task of tasks) {
                try {
                    await notifyUserAboutTask(task);
                    await sendAutoReply(task);
                } catch (taskError) {
                    console.error(`Ошибка при обработке задания "${task.title}":`, taskError.message);
                }
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке новых заданий:', error.message);
    }
}

// Функция для проверки cookies и авторизации
async function checkCookiesAndAuthorize() {
    const cookiesExist = await checkIfCookiesExist();
    if (!cookiesExist) {
        console.log('Cookies не найдены, выполняем авторизацию...');
        await authorizeAndSaveCookies();  // Вызов функции авторизации
    } else {
        console.log('Cookies найдены, авторизация не требуется.');
    }
}

// Запуск с проверкой cookies и авторизацией, если необходимо
async function startParser() {
    try {
        await checkCookiesAndAuthorize();
        console.log('Авторизация выполнена, cookies проверены и сохранены.');
        setInterval(checkForNewTasks, config.pollInterval);
        console.log('Парсер запущен и отслеживает все новые задания...');
    } catch (error) {
        console.error('Ошибка при авторизации и запуске парсера:', error.message);
    }
}

// Запуск основного процесса
startParser();