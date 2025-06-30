const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Create a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} name - User's name
     * @returns {Promise<object>} Created user
     */
    // In the create method:
    static async create(emailId, password, name, reg_num, role = 'staff', isOAuthLogin = 0) {
       // const hashedPassword = isOAuthLogin ? null : await bcrypt.hash(password, 10); // Added salt rounds
        const [result] = await pool.query(
            'INSERT INTO users (emailId, password, name,reg_num, role) VALUES (?, ?, ?, ?, ?)',
            [emailId, password, name, reg_num, role]
        );
        // console.log(result, "finall");
        return this.findById(result.insertId);
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<object|null>} User object or null if not found
     */
    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    /**
     * Find user by email
     * @param {string} email - User's email
     * @returns {Promise<object|null>} User object or null if not found
     */
    static async findByEmail(emailId) {
        const [rows] = await pool.query('SELECT * FROM users WHERE emailId = ?', [
            emailId,
        ]);
        // console.log(rows[0], "[]0");
        return rows[0] || null;
    }

    /**
     * Update user's refresh token
     * @param {number} id - User ID
     * @param {string|null} refreshToken - Refresh token or null to remove
     * @returns {Promise<void>}
     */
    static async updateRefreshToken(id, refreshToken) {
        await pool.query('UPDATE users SET refreshToken = ? WHERE id = ?', [
            refreshToken,
            id,
        ]);
    }

    /**
     * Verify user password
     * @param {string} password - Password to verify
     * @param {string} storedPassword - Hashed password from database
     * @returns {Promise<boolean>} True if password matches
     */
    static async verifyPassword(password, storedPassword) {
        return password === storedPassword;
       // return await bcrypt.compare(password, hashedPassword);
    }

    /**
 * Find or create user by Google ID
 * @param {string} googleId - Google ID
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @returns {Promise<object>} User object
 */
   // ...existing code...
static async findOrCreateByGoogle(googleId, emailId, name) {
    // First try to find by google_id
    const [googleUser] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    if (googleUser.length > 0) return googleUser[0];

    // Then try by email
    let user = await this.findByEmail(emailId);
    if (user) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        return user;
    }
    
//generate a placeholder reg_num for Google users
const reg_num = `G-${googleId}`;


    // Create new user without password
    const [result] = await pool.query(
        'INSERT INTO users (emailId, name, google_id, reg_num, role) VALUES (?, ?, ?, ?, ?)',
        [emailId, name, googleId, reg_num, 'student'] // Default to student for Google signups
    );
    return this.findById(result.insertId);
}
}



module.exports = User;
