
const path = require('path');

const express = require('express');
var cors = require('cors');

require('dotenv').config();

const contactRoutes = require('./routes/contactRoutes')
const sequelize=require('./util/database');
const Contact = require('./models/contact');

const app = express();

app.use(cors());


app.use(express.json());

app.use('/identify',contactRoutes);



sequelize.sync()
// sequelize.sync({force:true})
.then(()=>{
    console.log(process.env.PORT)
    app.listen(process.env.PORT)
})
.catch(err=>{console.log(err)});
