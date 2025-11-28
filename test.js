/* LOCAL HOSTING (mit Befehl node server.js)
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/qr', async (req, res) => {
  const data = req.query.data;
  if (!data) {
    return res.status(400).send('Parameter "data" fehlt.');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();

    const url = `https://edih-qr-generator.vercel.app/index.html`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#url-input');

    await page.evaluate((value) => {
      const input = document.getElementById('url-input');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, data);

    // Warte etwas, damit der SVG-QR-Code erzeugt wird
    await new Promise(resolve => setTimeout(resolve, 100));

    // SVG auslesen
    const svg = await page.$eval('#qr-code svg', el => el.outerHTML);

    if (!svg) {
      return res.status(500).send('SVG konnte nicht gefunden werden.');
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);

  } catch (error) {
    console.error('Fehler beim Generieren des QR-Codes:', error);
    res.status(500).send('Fehler beim Generieren des QR-Codes');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
}); */

const express = require('express');
const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = process.env.PORT || 3000;

app.get('/qr', async (req, res) => {
  const data = req.query.data;
  if (!data) return res.status(400).send('Parameter "data" fehlt.');

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    const url = `https://qr.edih.digital/`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#url-input');

    // Setze den Link ins Inputfeld und trigger das Event, damit QR-Code aktualisiert wird
    await page.evaluate((value) => {
      const input = document.getElementById('url-input');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, data);

    // Warte kurz, bis SVG gerendert wurde
    await page.waitForSelector('#qr-code svg', { timeout: 50 });
    await page.waitForTimeout(50);

    // Hole das SVG-Element aus dem DOM
    const svg = await page.$eval('#qr-code svg', el => el.outerHTML);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);

  } catch (error) {
    console.error('Fehler beim Generieren des QR-Codes:', error);
    res.status(500).send('Fehler beim Generieren des QR-Codes');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
