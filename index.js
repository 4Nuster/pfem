const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { stringify } = require('querystring');
const { syncBuiltinESMExports } = require('module');
//const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//app.use(fileUpload({createParentPath: true}));
app.use('/views', express.static(process.cwd() + '/views'));
app.use('/model-new', express.static(process.cwd() + '/model-new'));
app.use('/model', express.static(process.cwd() + '/model'));
app.use('/dataset', express.static(process.cwd() + '/dataset'));

//variables for input and generated dataset
let input;
let label = "";
const label1 = 'circle', label2 = 'star', label3 = 'sinus';

let {circles, stars, sinuses, news} = JSON.parse(fs.readFileSync("indeces.json"));

const sleep = ms => new Promise(r => setTimeout(r, ms));

//default
app.get('/ayy/lmao', (req, res) => {
    res.sendFile(process.cwd() + '/views/hi.html');
});

//----puppeteer apis----
//generating dataset
app.get('/virtual/dataset', (req, res) => {
    res.sendFile(process.cwd() + '/views/dataset.html');
});

//training
app.get('/train', (req, res) => {
    res.sendFile(process.cwd() + '/views/train.html');
});
  
//predicting
app.get('/virtual/predict', (req, res) => {
    res.sendFile(process.cwd() + '/views/predict.html');
});

//----deployment----
app.listen(process.env.PORT, () => {
    console.log('HOSTED ON ', process.env.PORT);
});

//----normal apis----
//send input
app.get('/api/input', (req, res) => {
    //console.log('array gon be sent', {'input': input});
    res.json({'input': input});
});

//send label
app.get('/api/label', (req, res) => {
    switch(label){
        case "circle": res.json({'label': label1, 'index': circles}); circles++; break;
        case "star": res.json({'label': label2, 'index': stars});   stars++;   break;
        case "sinus": res.json({'label': label3, 'index': sinuses}); sinuses++; break;
    }
    news++;
    let temp = JSON.stringify({
        "circles": circles,
        "stars": stars,
        "sinuses": sinuses,
        "news": news
    });
    fs.writeFileSync("indeces.json", temp);
});

//connection
app.get('/api/connect', (req, res) => {
    res.sendStatus(200);
});

//dataset generation
app.post('/api/dataset', (req, res) => {
    label = Object.keys(req.body)[0];
    input = req.body[label];
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:5000/virtual/dataset/');

        //console.log(await page.evaluate('ml5.version'));
        page.on('console', msg => console.log('>', msg.text()));

        await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: path.resolve('./dataset')});
        try{
            await page.waitForSelector('#done', {visible: true, timeout: 0});
        }
        catch(e){
            console.log('done');
        }
        browser.close();
        res.sendStatus(200);
    })();
});

//predicting
app.post('/api/predict', (req, res) => {
    console.log("aw ja");
    console.log(req.body);
    input = req.body[Object.keys(req.body)[0]];
    label = 0;

    let result = 0;
    let accuracy = 0;
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:5000/virtual/predict');

        page.on('console', msg => console.log('>', msg.text()));
        try{
            await page.waitForSelector('#done', {visible: true, timeout: 0});
        }
        catch(e){
            console.log('done');
        }
        result = await page.evaluate(() => output);
        accuracy = await page.evaluate(() => acc);
        browser.close();
        res.json({
            "result": result,
            "accuracy": accuracy
        });
    })();
    
});

//send the dataset indeces json file to the admin interface
app.get('/api/indeces', (req, res) => {
    res.sendFile(process.cwd() + "/indeces.json");
    (async () => {
        await sleep(1000);
        news = 0;
        let temp = JSON.stringify({
            "circles": circles,
            "stars": stars,
            "sinuses": sinuses,
            "news": news
        });
        fs.writeFileSync("indeces.json", temp);
    })();
    
});

app.post('/testing', (req, res) => {
    console.log(req.body[Object.keys(req.body)[0]]);

    console.log(Object.keys(req.body)[0]);
    res.sendStatus(200);
});