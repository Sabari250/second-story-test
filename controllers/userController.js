import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import validator from "validator";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signup = catchAsync(async (req, res, next) => {
  const {
    userName,
    email,
    password,
    passwordConfirm,
    address,
    firstName,
    lastName,
    phone,
  } = req.body;

  const existingUser = await User.findOne({ userName });
  if (existingUser) {
      return next(new AppError("User already exists with this username", 400));
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
      return next(new AppError("User already exists with this email", 400));
  }

  const phoneNumber = phone.phoneNumber;
  const existingPhone = await User.findOne({
    "phone.phoneNumber": phoneNumber,
  });
  if (existingPhone) {
    return next(
      new AppError("User already exists with this phone number", 400)
    );
  }

  const user = await User.create({
    userName,
    email,
    password,
    passwordConfirm,
    address,
    firstName,
    lastName,
    phone,
  });
  createToken(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return next(new AppError("Please provide email/mobile number and password!", 400));
  }

  let user;

  if (validator.isEmail(identifier)) {
    // If the identifier is an email
    user = await User.findOne({ email: identifier }).select("+password");
  } else if (validator.isMobilePhone(identifier, "any", { strictMode: false })) {
    // If the identifier is a mobile number
    user = await User.findOne({ "phone.phoneNumber": identifier }).select("+password");
  } else {
    // If the identifier is neither an email nor a mobile number
    return next(new AppError("Please provide a valid email/mobile number!", 400));
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email/mobile number or password", 401));
  }

  createToken(user, 200, res);
});


export { signup, login };


