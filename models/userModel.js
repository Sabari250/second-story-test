import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: [true, "Please enter your UserName"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirmmm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  firstName: {
    type: String,
    required: [true, "Please enter your First Name"],
  },
  lastName: {
    type: String,
    required: [true, "Please enter your Last Name"],
  },
  address: {
    add_line1: {
      type: String,
      // required: [true, "Please fill out address"],
    },
    add_line2: {
      type: String,
    },
    city: {
      type: String,
      // required: [true, "Please fill out address"],
    },
    state: {
      type: String,
      // required: [true, "Please fill out address"],
    },
    postal_code: {
      type: String,
      // required: [true, "Please fill out address"],
    },
  },
  phone: {
    countryCode: {
      type: String,
    },
    phoneNumber: {
      type: String,
      // required: [true, "Please tell your phone number"],
    },
  },
  cart: {
    type: Array,
  },
  invoice: {
    type: Array,
  },
  checkout: {
    type: Array,
  },
  shelf: {
    keep: {
      type: Array,
    },
    sell: {
      type: Array,
    },
    lend: {
      type: Array,
    },
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});
userSchema.pre("save", async function (next) {
  // check is password changed ??
  if (!this.isModified("password")) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
