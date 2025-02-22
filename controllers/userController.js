import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import validator from "validator";
import { promisify } from "util";
import sendMailTo from "../utils/email.js";
import crypto from "crypto";

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
  // if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

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
    firstName,
    lastName,
    phone,
  });
  createToken(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return next(
      new AppError("Please provide email or username and password!", 400)
    );
  }

  let user;

  if (validator.isEmail(identifier)) {
    user = await User.findOne({ email: identifier }).select("+password");
  } else if (
    validator.isMobilePhone(identifier, "any", { strictMode: false })
  ) {
    user = await User.findOne({ "phone.phoneNumber": identifier }).select(
      "+password"
    );
  } else {
    return next(
      new AppError("Please provide a valid email/mobile number!", 400)
    );
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email/mobile number or password", 401));
  }

  createToken(user, 200, res);
});

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

const getCurrentUser = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user) {
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } else {
    return next(new AppError("User not found", 404));
  }
});

const updateUserProfile = catchAsync(async (req, res, next) => {
  const updates = req.body;
  const userId = req.user._id;

  if (!req.user) {
    return next(new AppError("User not found", 404));
  }

  let user = await User.findById(userId);

  if (updates.addresses) {
    updates.addresses.forEach((newAddress) => {
      if (newAddress._id) {
        // Update existing address
        const addressIndex = user.addresses.findIndex(
          (address) => address._id.toString() === newAddress._id
        );

        if (addressIndex !== -1) {
          user.addresses[addressIndex] = {
            ...user.addresses[addressIndex],
            ...newAddress,
          };
        } else {
          return next(new AppError("Address not found", 404));
        }
      } else {
        // Add new address
        user.addresses.push(newAddress);
      }
    });

    delete updates.addresses; // Remove addresses from updates to avoid conflict with other updates
  }

  // Update other fields
  Object.keys(updates).forEach((key) => {
    user[key] = updates[key];
  });

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createToken(user, 200, res);
});

const addToCart = catchAsync(async (req, res, next) => {
  const { bookId } = req.body;
  const currentUser = req.user;

  const cartItem = { bookId };

  await User.findByIdAndUpdate(
    currentUser._id,
    { $push: { cart: cartItem } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      message: "Item added to cart successfully",
    },
  });
});

const getCart = async (req, res) => {
  const currentUser = req.user;

  res.status(200).json({
    status: "success",
    data: {
      cart: currentUser.cart,
    },
  });
};

const removeFromCart = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  const currentUser = req.user;

  await User.findByIdAndUpdate(
    currentUser._id,
    { $pull: { cart: { bookId: bookId } } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      message: "Item removed from cart successfully",
    },
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://127.0.0.1:4000/api/v1/user/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  const isEmailSent = await sendMailTo({
    email: user.email,
    subject: "Your password reset token (valid for 10 min)",
    message,
  });

  if (!isEmailSent) {
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

const passwordReset = catchAsync(async (req, res, next) => {
  // Hash the token from the URL to compare it with the one in the database
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Find the user by the hashed token and check if the token has expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired.", 400));
  }

  // Update the user's password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the updated user document
  await user.save();

  createToken(user, 200, res);
});

const createInvoice = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  let invoice_id;
  let invoiceNumber = user.invoices;
  if (invoiceNumber.length === null) {
    invoice_id = 0;
  } else {
    invoice_id = invoiceNumber.length + 1;
  }

  const { item_id, invoice_date, invoice_amount, payment_method } = req.body;

  user.invoices.push({
    invoice_id,
    item_id: item_id,
    invoice_date: invoice_date || Date.now(),
    invoice_amount: invoice_amount,
    payment_method: payment_method,
  });

  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    status: "success",
    data: {
      invoice: user.invoices[user.invoices.length - 1],
    },
  });
});

const getallInvoices = catchAsync(async (req, res) => {
  const invoices = await User.find({}).select("invoices");
  res.status(200).json({
    status: "success",
    data: {
      invoices,
    },
  });
});

const getInvoiceById = catchAsync(async (req, res) => {
  const invoiceId = req.params.id;

  const invoice = await User.findById(invoiceId);
  console.log(invoice);
  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      invoice,
    },
  });
});

const addToWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const { itemId } = req.body;
  if (!itemId) {
    return next(new AppError("Item ID is required", 400));
  }

  if (user.wishlist.includes(itemId)) {
    return next(new AppError("Item already in wishlist", 400));
  }

  user.wishlist.push(itemId);
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    status: "success",
    data: {
      wishlist: user.wishlist,
    },
  });
});

const removeFromWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const { itemId } = req.body;
  if (!itemId) {
    return next(new AppError("Item ID is required", 400));
  }

  const itemIndex = user.wishlist.indexOf(itemId);
  if (itemIndex === -1) {
    return next(new AppError("Item not found in wishlist", 404));
  }

  user.wishlist.splice(itemIndex, 1);
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    data: {
      wishlist: user.wishlist,
    },
  });
});

const getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("wishlist");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      wishlist: user.wishlist,
    },
  });
});

// Giving access to the Admin
const restrictToAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
};

export {
  signup,
  login,
  protect,
  logout,
  getCurrentUser,
  updateUserProfile,
  updatePassword,
  addToCart,
  getCart,
  removeFromCart,
  forgotPassword,
  passwordReset,
  restrictToAdmin,
  createInvoice,
  getallInvoices,
  getInvoiceById,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};
