const express = require("express");
const server = express();
const mongoose = require("mongoose");
const {sendNftReq, notifyValidators}= require('./websocket.js');
const bodyParser=require("body-parser");
const cors = require("cors");
const userController = require("./controllers/user-controller");

server.use(bodyParser.json());
server.use(cors());

server.post("/api/login-generator", userController.loginGenerator);
server.post("/api/login-consumer", userController.loginConsumer);
server.post("/api/login-validator", userController.loginValidator);

server.post("/api/register-generator", userController.registerGenerator);
server.post("/api/register-consumer", userController.registerConsumer);
server.post("/api/register-validator", userController.registerValidator);

server.post("/api/send-ndvi",(req,res)=>{
  const {address,value,coords}=req.body;
  notifyValidators(address,value,coords);
});
server.post("/api/retire-cct",(req,res)=>{
  const {address,amount}=req.body;
  sendNftReq(address,amount);
});

//connect with database and start the server
const dbUri = process.env.MONGO_URI || `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}/${process.env.DB_NAME}?authSource=admin`;

mongoose.connect(
    dbUri
    ,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
  .then(() => {
    console.log(`MongoDB connection established!`);
    server.listen(8000, () => {
      console.log(`Server is running on port 8000...`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection failed!`);
    console.log(error.message);
});
