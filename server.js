
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/next-event', (req, res) => {
    fs.readFile('data.json', (err, data) => {
        if (err) {
            res.status(500).send({ message: 'Error reading data file' });
            return;
        }
        let eventData = JSON.parse(data);
        if (!eventData.eventDate) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            let thursdays = 0;
            for (let i = 1; i < 31; i++) {
                const date = new Date(year, month, i);
                if (date.getDay() === 4) { // 4 = Thursday
                    thursdays++;
                    if (thursdays === 2) {
                        eventData.eventDate = date;
                        break;
                    }
                }
            }
        }
        res.json(eventData);
    });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/admin/update', async (req, res) => {
    const { eventDate, letterboxdUrl } = req.body;

    try {
        const { data } = await axios.get(letterboxdUrl);
        const $ = cheerio.load(data);
        const movieTitle = $('meta[property="og:title"]').attr('content');
        const posterUrl = $('meta[property="og:image"]').attr('content');

        fs.readFile('data.json', (err, data) => {
            if (err) {
                res.status(500).send({ message: 'Error reading data file' });
                return;
            }
            let eventData = JSON.parse(data);
            eventData = {
                ...eventData,
                eventDate,
                letterboxdUrl,
                movieTitle,
                posterUrl
            };
            fs.writeFile('data.json', JSON.stringify(eventData, null, 2), (err) => {
                if (err) {
                    res.status(500).send({ message: 'Error writing data file' });
                    return;
                }
                res.redirect('/');
            });
        });
    } catch (error) {
        res.status(500).send({ message: 'Error scraping Letterboxd URL' });
    }
});

app.get('/suggest', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'suggest.html'));
});

// Add your TMDb API key here
const tmdbApiKey = 'YOUR_TMDB_API_KEY';

app.get('/api/suggest', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ message: 'Query is required' });
    }

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${query}`);
        res.json(response.data.results);
    } catch (error) {
        res.status(500).json({ message: 'Error searching for movies' });
    }
});

app.post('/api/suggest', (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Movie title is required' });
    }

    fs.readFile('data.json', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data file' });
        }

        let jsonData = JSON.parse(data);
        if (!jsonData.suggestions) {
            jsonData.suggestions = [];
        }
        jsonData.suggestions.push(title);

        fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error writing data file' });
            }
            res.status(200).json({ message: 'Suggestion submitted successfully' });
        });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
