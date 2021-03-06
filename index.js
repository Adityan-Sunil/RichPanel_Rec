'use strict'

const express = require('express');
const app = express();
const axios = require('axios').default;
const parser = app.use(express.json());
const env = require('dotenv');
let cors = require('cors')

app.use(cors());
env.config();
//const urlenc = express.urlencoded({extended:true})
const pg = require("pg");
const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false}
});

db.connect((err)=>{
    if(err)
        console.log(err);
});

const page_token = process.env.PAGE_ACCESS_TOKEN;

app.get('/',(req, res) =>{
    console.log("Hello");
    res.send("Hello");
})

function sendToDB(event){
    let eventSender = event.sender.id;
    let timestamp = event.timestamp;
    let page_end = event.recipient.id;
    let content = event.message;

    db.query("INSERT INTO EVENTS_TABLE (SENDER, PAGE, TIME_STAMP, MSG) VALUES ($1,$2, to_timestamp($3) ,$4)",[eventSender, page_end, timestamp, content], (err) =>{
        if(err){
            console.log(err);
            return -1;
        }
    })
    return 0;
}

function fetchFromDB(page_end){
    console.log(page_end)
    db.query("SELECT * FROM EVENTS_TABLE", (err, res)=>{
        if(err){
            console.log(err);
            return -1;
        }
        else{
            return res.rows;
        }
    })
}



app.post('/webhook', (req, res)=>{

    let body = req.body;
    if(body.object === 'page'){
        body.entry.forEach(entry => {
            let event = entry.messaging[0];
            console.log(event.sender.id);
            let PSID = event.sender.id;
            if(event.message){
                console.log("message recieved");
                sendToDB(event);
                handleMessage(PSID, event.message);
            } else if(event.postback){
                console.log("postback received");
                handlePostback(PSID, event.postback);
            }
        });
        res.status(200).send('Event Recieved');
    } else {
        res.sendStatus(404);
    }
})

app.listen(process.env.PORT||4000, ()=>{
    console.log("Server is listening");
})
app.post('/get_convo', (req, res)=>{
    let pageID = req.body.pageId;
    //console.log(pageID);
    db.query("SELECT * FROM EVENTS_TABLE WHERE PAGE = $1",[pageID], (err, result)=>{
        if(err){
            console.log(err);
            res.sendStatus(404);
        }
        else{
            res.send(result.rows);
        }
    })
})
app.post('/get_convo_list', (req, res)=>{
    let pageID = req.body.pageId;
    //console.log(pageID);
    db.query("SELECT DISTINCT(SENDER) as sender FROM EVENTS_TABLE WHERE PAGE = $1",[pageID], (err, result)=>{
        if(err){
            console.log(err);
            res.sendStatus(404);
        }
        else{
            res.send(result.rows);
        }
    })
})
app.post('/replysend', (req, res) =>{
    let reply = req.body.reply;
    let psid = req.body.psid;
    console.log(reply);
    console.log(psid);
    let response = {
        "text":reply
    }
    callSendAPI(psid, response)
    res.send("sent");
})
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN;
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });
  function callSendAPI(PSID, content){

    axios.post("https://graph.facebook.com/v11.0/me/messages?access_token="+page_token,{
        "messaging_type": "RESPONSE",
        "recipient":{
            "id":PSID
        },
        "message":content
    }).then(()=>{
        console.log("Success");
    }).catch((error)=>{
        console.log(error);
    })

  }
  function handleMessage(PSID, event_message){
        let response;

        if(event_message.text){
            response = {
                "text":"Hello World"
            }
        }
        callSendAPI(PSID, response);
    }