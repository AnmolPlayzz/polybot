/*
Before you ask me why do I listen for a port over here...
This is so that Koyeb (my deployment service) marks my service as "healthy"
moreover, its good for people using replit and glitch to host bots
*/
const express = require('express');
const server = express();

server.all('/', (req, res)=>{
    res.send('Your bot is alive!')
})
function keepAlive(){
    server.listen(8080, ()=>{console.log("Server is Ready!")});
}
module.exports = keepAlive;