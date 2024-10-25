const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'cookies.json');


async function loadCookies(page) {
    try {
        const cookiesString = await fs.readFile(COOKIES_PATH);
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log('Cookies загружены.');
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Cookies не найдены, выполняем авторизацию для их создания...');
            await authorizeAndSaveCookies();
            await loadCookies(page);
        } else {
            console.error('Не удалось загрузить cookies:', err);
        }
    }
}

// Функция автоотклика
async function sendAutoReply(task) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await loadCookies(page);

    try {
        const replyMessage = "Здравствуйте! Я заинтересован в выполнении этого задания.";
        await page.goto(task.link, { waitUntil: 'networkidle2' });

        await page.type('textarea.reply-textarea-selector', replyMessage);
        await page.click('button.submit-reply-button');

        console.log(`Автоотклик отправлен на задание: ${task.title}`);
    } catch (error) {
        console.error('Ошибка при отправке автоотклика:', error.message);
    } finally {
        await browser.close();
    }
}


async function parseYuduTasks() {
    const url = `https://youdo.com/tasks-all-opened-all`;
    const tasks = [];

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await loadCookies(page);

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const taskElements = await page.$$('.TasksList_title__oFe_x');

        for (const elem of taskElements) {
            try {
                const title = await page.evaluate(el => el.textContent, elem);
                const link = await elem.evaluate(el => el.getAttribute('href'));
                tasks.push({ title, link: `https://youdo.com${link}` });
            } catch (error) {
                console.error('Ошибка при парсинге задания:', error.message);
            }
        }
        console.log(`Найдено заданий: ${tasks.length}`);
    } catch (error) {
        console.error('Ошибка при парсинге заданий:', error.message);
    } finally {
        await browser.close();
    }
    return tasks;
}
async function authorizeAndSaveCookies() {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    try {
        await page.goto('https://youdo.com', { waitUntil: 'networkidle2' });


        await page.waitForSelector('.toolbar_logo__nqI8O', { visible: true, timeout: 60000 });
        await page.evaluate(() => {
            const elem = document.querySelector('.toolbar_logo__nqI8O');
            if (elem) elem.click();
        });

        console.log('Первая кнопка нажата, ожидаем меню с кнопкой "Войти"...');

 
        await page.waitForSelector('.MobileMenu_linksItem__OhHQ7 span', { visible: true, timeout: 60000 });
        await page.evaluate(() => {
            const elem = document.querySelector('.MobileMenu_linksItem__OhHQ7 span');
            if (elem) elem.click();
        });

        console.log('Кнопка "Войти" нажата, ожидаем страницу авторизации...');

        await page.waitForSelector('span[data-test="LoginWithEmailButton"]', { visible: true, timeout: 60000 });
        await page.evaluate(() => {
            const elem = document.querySelector('span[data-test="LoginWithEmailButton"]');
            if (elem) elem.click();
        });


        await page.waitForSelector('input[type="email"]', { timeout: 60000 });
        await page.type('input[type="email"]', 'zhranitelz9@gmail.com');
        await page.waitForSelector('input[type="password"]', { timeout: 60000 });
        await page.type('input[type="password"]', 'Deniilskywarser1!');


        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const cookies = await page.cookies();
        await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        console.log('Авторизация прошла успешно, cookies сохранены.');

    } catch (error) {
        console.error('Ошибка при авторизации:', error.message);
    } finally {
        await browser.close();
    }
}

async function checkIfCookiesExist() {
    try {
        await fs.access(COOKIES_PATH);
        return true;
    } catch {
        return false;
    }
}
module.exports = { parseYuduTasks, authorizeAndSaveCookies, sendAutoReply, checkIfCookiesExist };
