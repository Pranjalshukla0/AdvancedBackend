import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    
        console.log(`this is  token without decoded:  ${token}`)
    if(!token){
        throw new ApiError(401,"Unauthorized request")

    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    console.log( "this is decoded token in the authmiddleware",decodedToken);
    
    if(!user){
        throw new ApiError(401,"InvalidAccessToken");
    }
    req.user=user
    console.log(`this is user detail in auth middleware ${user}`)
    next();
    } catch (error) {
       throw new  ApiError(401,error?.message || "Invalid access Token") 
    }
})
