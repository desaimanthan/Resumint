const jwt = require('jsonwebtoken');

const generateTokens = (userId, rememberMe = false) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  // Set different refresh token expiration based on rememberMe
  const refreshTokenExpiry = rememberMe ? '30d' : process.env.JWT_REFRESH_EXPIRE;
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: refreshTokenExpiry }
  );

  return { accessToken, refreshToken, refreshTokenExpiry };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken
};
