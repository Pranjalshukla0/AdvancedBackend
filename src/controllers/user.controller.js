import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  // get  user  detail from  frontend or postman
  const { fullName, email, username, password } = req.body;
 // console.log(req.body);
  // validation  not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field is required");
  }
  // check if user is alredy exits  or not: username ,email
  const existedUser =  await User.findOne({
    $or: [{ username }, { email }],
  });
  if(existedUser){
    throw new ApiError(409,"User is already exist")
  }
  //check image or avatar
   const avatarLocalPath=req.files?.avatar[0]?.path;
  //const coverImageLocalPath =req.files?.coverImage[0]?.path;
  //console.log(req.files)
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].path)

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
  }
  // upload them to cloudinary ,avatar
  const  avatar =  await uploadOnCloudinary(avatarLocalPath)
  const coverImage= await uploadOnCloudinary(coverImageLocalPath)
  if(!avatar){
    throw new ApiError(400,"Avatar is required")
  }
  // create  user  object -- create entry in db
  
  const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })

    // check for  user creation and removed password  refreshtoken from the data 
  const createdUser =await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!createdUser){
    throw new ApiError(500, "something went wrong")
  }
 

  
  // return response
  return res.status(201).json(
    new ApiResponse(200, createdUser,"User registerd successfully ")
  )
});

export { registerUser };
