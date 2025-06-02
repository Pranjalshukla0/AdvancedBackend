
const asyncHandler =(requestHandler)=>{
(req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((error)=>next)
}
}



export {asyncHandler}









//step:1 const  asyncHandler =()=>{}
//step:2 const  asyncHandler =(func)=>{}
//step:3 const  asyncHandler =(func)=>{()=>}

//this is for try catch  block but we dont use this we use promise vala
// const asyncHandler = (func) => async (req, res, next) => {
//   try {
//     await func(req, res, next);
//   } catch (error) {
//     res.status(err.code || 400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
