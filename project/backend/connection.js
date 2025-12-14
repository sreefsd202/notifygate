const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://vgate608:vgate608@cluster0.28pmwtc.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected!'))
  .catch((err)=>console.error("MongoDB connection error:",err))
  