import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something  went wrong while generating the access and refresh tokens"
    );
  }
};

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
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User is already exist");
  }
  //check image or avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath =req.files?.coverImage[0]?.path;
  //console.log(req.files)
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].path
  )
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }
  // upload them to cloudinary ,avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  // create  user  object -- create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // check for  user creation and removed password  refreshtoken from the data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd successfully "));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body ->data collect
  // username or email
  // password checking
  // access token and refresh token
  // send cookies
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User is not is found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("newRefreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "Access token refreshed successfully "
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "User not Found");
  }

  console.log(user);
  const isMatch = await user.isPasswordCorrect(currentPassword);
  console.log(isMatch);
  if (!isMatch) {
    throw new ApiError(401, "Current Password is Incorrect");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New passwords do not match");
  }
  console.log(newPassword);
  user.newPassword = newPassword;
  await User.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current User is fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { FullName, email } = req.body;
  if (!FullName || !email) {
    throw new ApiError(400, "All field is requred ");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        FullName: FullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw new ApiError(400, "User Not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, user, "Account updated successfully"));
});

const updateUserAvatar= asyncHandler(async(req, res) =>{
 const avatarLocalPath=req.file?.path
 if(avatarLocalPath) {
  throw new ApiError(400,"Avatar is not  found");
 }
 const avatar =await uploadOnCloudinary(avatarLocalPath);

 if(!avatar.url){
  throw new ApiError(401, " URL is not generated successfully");
 }
 const user =await User.findByIdAndUpdate(req.user?._id,{
 
  $set:{
  avatar: avatar.url,
  }
 
},{new:true})
res.status(200).json(new ApiResponse(200,user,"Avatar Image is updated Successfully"))
})

const updateCoverPage=asyncHandler(async(req,res)=>{
   const coverImageLocalPath=req.file?.path
   if(!coverImageLocalPath.url){
    new ApiError(400, "CoverPage is not found");
   }
    const coverPage=await  uploadOnCloudinary(coverImageLocalPath.url);
   const user= User.findByIdAndUpdate(req.user?._id,{
  $set:{
   coverPage: coverPage.url,
  }
    },{new:true})

    res.status(200).json(new ApiResponse(200,user,"Cover Image is updated Successfully"))
  })
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCoverPage,
  updateAccountDetails,
  updateUserAvatar
};
