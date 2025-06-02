import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json({limit:"16kb"}))

//  const PORT =process.env.PORT || 4000;

//   app.listen(PORT,()=>{
//     console.log(`Server is running on ${PORT}`)
//   })
export { app };
