'use strict'

const express = require('express');
const app = express();
const axios = require('axios').default;
const parser = app.use(express.json());
//const urlenc = express.urlencoded({extended:true})

const page_token = process.env.PAGE_ACCESS_TOKEN;

app.get('/',(req, res) =>{
    console.log("Hello");
    res.send("Hello");
})
app.post('/webhook', (req, res)=>{

    let body = req.body;
    if(body.object === 'page'){
        body.entry.forEach(entry => {
            let event = entry.messaging[0];
            console.log(event.sender.id);
            let PSID = event.sender.id;
            if(event.message){
                console.log("message recieved");
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

app.listen(process.env.PORT||3000, ()=>{
    console.log("Server is listening");
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