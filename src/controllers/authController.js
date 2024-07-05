import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { validationResult } from "express-validator";
import { models } from "../models/index.js";
import { SMSService } from "../services/SMSService.js";

const MAX_SMS_CODE_LIFETIME_IN_MINUTES = 15;
const MIN_TIME_IN_MINUTES_BEFORE_CODE_RESEND = 1;
const MAX_INCORRECT_SMS_CODE_ATTEMPTS = 3;

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  await models.User.update({ refreshToken }, { where: { id: user.id } });
  return refreshToken;
};

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "48h",
  });
};

const codeCheck = async (phone, code) => {
  const user = await models.User.findOne({ where: { phone } });
  if (user === null) {
    return -1;
  }

  const attempt = await models.PasswordRecoveryAttempt.findOne({
    where: { sms_code: code, user_id: user.id },
  });
  if (attempt === null) {
    const attempt = await models.PasswordRecoveryAttempt.findByUserId(user.id);
    if (attempt !== null) {
      attempt.incorrect_attempts += 1;
      await attempt.save();
    }

    return -1;
  }

  const attemptLifetime = await attempt.getLifetime();
  if (
    attemptLifetime >= MAX_SMS_CODE_LIFETIME_IN_MINUTES ||
    attempt.incorrect_attempts >= MAX_INCORRECT_SMS_CODE_ATTEMPTS
  ) {
    return -2;
  }

  return { user, attempt };
};

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const fcmToken = req.body.fcmToken || null;
    const phone = req.body.phone.toString();
    const existingUser = await models.User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).send({ message: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password.trim(), 8);
    const user = await models.User.create({
      phone,
      password: hashedPassword,
      role_id: 1,
      fcm_token: fcmToken,
    });

    const role = await models.Role.findOne({ where: { id: user.role_id } });
    user.dataValues.role = role.dataValues;

    await models.Person.create(
      {
        user_id: user.id,
      });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(201).send({
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const fcmToken = req.body.fcmToken || null;
    const phone = req.body.phone.toString();
    const user = await models.User.scope("withPassword").findOne({
      where: { phone },
      include: [{ model: models.Role, as: "role" }],
    });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).send({ message: "Authentication failed" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    await models.User.update(
      { refresh_token: refreshToken, fcm_token: fcmToken },
      { where: { id: user.id } }
    );

    res.status(200).send({
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).send({ message: "Refresh Token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await models.User.findOne({
      where: { id: decoded.id, refresh_token: refreshToken },
      include: [{ model: models.Role, as: "role" }],
    });

    if (!user) {
      return res.status(401).send({ message: "Invalid Refresh Token" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    await models.User.update(
      { refresh_token: newRefreshToken },
      { where: { id: user.id } }
    );

    res.status(200).send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user
    });
  } catch (error) {
    res.status(500).send();
  }
};

export const getUser = async (req, res) => {
  const person = await models.Person.findOne({
    where: { user_id: req.user.id },
    include: [
      {
        model: models.User,
        as: "user",
        attributes: ["id", "phone", "approved"],
        include: [{ model: models.Role, as: "role", attributes: ["name"] }],
      },
      { model: models.Contragent, as: "contragent" },
      { model: models.JobPosition, as: "jobPosition" },
      {
        model: models.DrivingLicence,
        as: "drivingLicense",
      },
      {
        model: models.Passport,
        as: "passport",
        include: [
          {
            model: models.PassportPhoto,
            as: "photos"
          }
        ]
      }
    ],
  });

  if (!person) {
    return res.status(404).send({ message: "Person not found" });
  }
  res.status(200).send({ person });
};

export const logout = async (req, res) => {
  try {
    await models.User.update(
      { refresh_token: null },
      { where: { id: req.user.id } }
    );
    res.status(200).send({ message: "Logout successful" });
  } catch (error) {
    res.status(500).send();
  }
};

export const recoverPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const { phone } = req.body;
  try {
    const user = await models.User.findOne({ where: { phone } });
    if (user === null) {
      return res.status(200).json({
        message:
          "If there is an user with this phone, the code is sent to this phone.",
      });
    }

    const attempt = await models.PasswordRecoveryAttempt.getOrCreate(user.id);
    const attemptLifetime = await attempt.getLifetime();

    if (
      attempt.sms_code &&
      attemptLifetime <= MIN_TIME_IN_MINUTES_BEFORE_CODE_RESEND
    ) {
      return res.status(429).json({
        message:
          "The code was sent less than a minute ago. Please wait a minute before trying again.",
      });
    }

    attempt.sms_code = randomInt(100000, 999999).toString();
    await attempt.save();

    const result = await SMSService.sendPasswordRecoveryCode(
      attempt.sms_code,
      phone
    );
    if (result.status !== 200) {
      return res.status(500).json({ error: "Internal SMS API error" });
    }
    return res.status(200).json({
      message:
        "If there is an user with this phone, the code is sent to this phone.",
    });
  } catch (error) {
    console.error(`Error when trying to recover password: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const checkCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const { phone, code } = req.body;
  try {
    const result = await codeCheck(phone, code);
    if (result === -1) {
      return res.status(400).json({
        message:
          "The code is incorrect. Please ensure you have entered the correct code and try again.",
      });
    }
    if (result === -2) {
      return res.status(400).json({
        message:
          "The code is expired or maximum number of incorrect code input attempts exceeded, please request a new code.",
      });
    }

    return res.status(200).json({
      message:
        "The code is correct, please proceed with changing your password.",
    });
  } catch (error) {
    console.error(`Error while trying to validate SMS code: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const { phone, code, password } = req.body;
  try {
    const result = await codeCheck(phone, code);
    if (result === -1) {
      return res.status(400).json({
        message:
          "The code is incorrect. Please ensure you have entered the correct code and try again.",
      });
    }
    if (result === -2) {
      return res.status(400).json({
        message:
          "The code is expired or maximum number of incorrect code input attempts exceeded, please request a new code.",
      });
    }

    const { user, attempt } = result;

    user.password = await bcrypt.hash(password.trim(), 8);
    await user.save();

    await attempt.destroy();

    return res
      .status(200)
      .json({ message: "Password was successfully changed." });
  } catch (error) {
    console.error(`Error while trying to reset user password: ${error}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  register,
  login,
  refreshToken,
  getUser,
  logout,
  recoverPassword,
  resetPassword,
};
