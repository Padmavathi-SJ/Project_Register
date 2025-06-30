const jwt = require("jsonwebtoken");
const pool = require('../config/db');

const userAuth = async (req, res, next) => {
  try {
    // Check both cookies and Authorization header
    const token = req.cookies.accessToken;
    // console.log("Token received:", token);

    if (!token) {
      console.log("No token found");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        shouldRedirect: true
      });
    }

    // Verify JWT token
    const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Token decoded successfully:", decodedMessage);
    // Check if user exists in database
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [decodedMessage.userId]
    );
    // console.log(rows, "rows");
    if (!rows || rows.length === 0) {
      console.log("User not found in database");
      return res.status(401).json({
        success: false,
        message: "User not found",
        shouldRedirect: true
      });
    }

    // Attach user ID to request object
    req.user = decodedMessage.userId;
    // console.log("Authentication successful for user ID:", req.user);
    next();

  } catch (error) {
    console.error("Authentication error:", error.message);

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        shouldRedirect: true
      });
    }

    if (error.name === "TokenExpiredError") {
      res.clearCookie("accessToken");
      return res.status(401).json({
        success: false,
        message: "Token expired",
        shouldRedirect: true
      });
    }

    // For other errors
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      shouldRedirect: true
    });
  }
};

module.exports = userAuth;


// const jwt = require("jsonwebtoken");
// const createError = require("http-errors");
// const db = require('../config/db');

// const userAuth = (req, res, next) => {
//   try {
//     // Check both cookies and Authorization header
//     const token = req.cookies.accessToken;
//     console.log(token, "token");
//     if (!token) {
//       console.log("token 1");
//       return res.status(401).json({
//         success: false,
//         message: "TokenMissing",
//         shouldRedirect: true // Add this flag for frontend handling
//       });
//     }
//     console.log("token 1");
//     const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("token 2", decodedMessage);
//     let sql = "SELECT * FROM users WHERE id = ?";
//     db.query(sql, [decodedMessage.id], (error, result) => {
//       if (error) return next(error);

//       if (result.length === 0) {
//         return res.status(401).json({
//           success: false,
//           message: "User does not exist!",
//           shouldRedirect: true
//         });
//       }

//       req.user = decodedMessage.id;
//       next();
//     });
//   } catch (error) {
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token!",
//         shouldRedirect: true
//       });
//     }
//     if (error.name === "TokenExpiredError") {
//       res.clearCookie("token");
//       return res.status(401).json({
//         success: false,
//         message: "Token has expired!",
//         shouldRedirect: true
//       });
//     }
//     next(error);
//   }
// };
// module.exports = userAuth;
