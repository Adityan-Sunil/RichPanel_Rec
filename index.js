'use strict'

const express = require('express');
const app = express();

const parser = express.json();


app.post('/webhook', (req, res)=>{
    let body = req.body;
    if(body.object === 'page'){
        body.entry.forEach(entry => {
            let event = entry.messaging[0];
            console.log(event);
        });
        res.status(200).send('Event Recieved');
    } else {
        res.sendStatus(404);
    }
})

app.listen(process.env.PORT||3000, ()=>{
    console.log("Server is listening");
})
