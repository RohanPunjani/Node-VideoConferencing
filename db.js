const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');
require('dotenv/config');

const UserSchema = mongoose.Schema({
    id: {
    }
        
})


mongoose.connect(process.env.MONGO_URI,
    {useNewUrlParser:true},()=>{
        console.log("Connected to the db")
    }
  )

