// require  is use in commonjs but we use module it through an error
// require('dotenv').config({path: './env'});
import dotenv from "dotenv";

import connectDB from "./db/index.js";
dotenv.config({
  path: "./env",
});

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 4000,()=>{
    console.log(`Server is running at port :${process.env.PORT}`)
  })
})
.catch((error)=>{
  console.log("MongoDB is not working properly",error)
})

/*first approach 
isme hum database connection aur server setup dono idhr hi kr rhe hai  ,yeh messy apporch bhi hai jo hum use nhi karenge   hum second approach use karenge*/

// import express from "express"
// const app =express()

// ;(async()=>{
// try {
//  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//  app.on("error",(error)=>{
//     console.log("database is not connected",error);
//  })
//  app.listen(process.env.PORT,()=>{
//     console.log(`server is running on ${process.env.PORT}`)
//  })
// } catch (error) {
//   console.error("ERROR : ",error)
//   throw error
// }
// })()
