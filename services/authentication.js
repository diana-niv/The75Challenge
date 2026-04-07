// Import tools we need for security
const jwt = require('jsonwebtoken'); // For creating and checking login tokens
const bcrypt = require('bcrypt');     // For hiding passwords safely

// Get our secret key from environment variables (keeps it safe)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * Check if a password matches the hidden version in our database
 * @param {string} password - The password the user typed
 * @param {string} hash - The hidden password from our database
 * @returns {Promise<boolean>} - True if passwords match, false if not
 */
async function checkPassword(password, hash) {
    let pw = await bcrypt.compare(password, hash); // Compare the passwords
    return pw;
}

/**
 * Check if a user's login information is correct
 * If correct, create a login token and return user info
 * If wrong, return an error message
 *
 * @param {Object} credentials - Contains username and password
 * @param {Array} users - List of all users from database
 * @returns {Object} - Success/failure result with token or error
 */
async function authenticateUser({ username, password }, users) {
    // Find the user with this email address
    const user = users.find(u => u.email === username);

    if (!user) {
        return { success: false, error: "User not found." }; // No user with this email
    }
    
    // Check if the password is correct
    const passwordMatch = await checkPassword(password, user.password);
    if (!passwordMatch) {
        return { success: false, error: "Incorrect password." }; // Wrong password
    }

    // Create a special token that proves the user is logged in
    const accessToken = jwt.sign({
        id: user.id,      // User's ID
        name: user.name,  // User's name
        role: user.role   // User's role (admin or regular user)
    }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); // Token lasts 1 hour

    return { success: true, accessToken, user }; // Login successful
}

/**
 * Check if a user is logged in by looking at their token
 * This runs on every page to see if someone is logged in
 *
 * @param {Object} req - The request from the browser
 * @param {Object} res - The response we send back
 * @param {Function} next - Continue to the next step
 */
function authenticateJWT(req, res, next) {
    const token = req.cookies["accessToken"]; // Get the login token from browser

    if (token) {
        // Check if the token is valid and not expired
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                // Token is invalid or expired
                return res.sendStatus(403); // Tell browser "forbidden"
            }

            console.log(user); // Show user info in console for debugging
            console.log('Decoded JWT user:', user);
            req.user = user; // Save user info for this request
            next(); // Continue to the next step
        });
    } else {
        // No token found - user is not logged in
        return next(new Error("Access denied: Try to login."));
    }
}

/**
 * Check if the current user is an admin
 * Only admins can access certain pages
 */
function authorizeAdmin (req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, let them continue
    } else {
        res.send("You don't have permission to use this action."); // Not admin
    }
}

/**
 * Check if user can access a specific profile
 * Users can only see their own profile, admins can see all profiles
 */
function authorizeSelfOrAdmin(req, res, next) {
    const userId = req.params.id;        // Which profile they want to see
    const loggedInUser = req.user;       // Who is currently logged in

    // Allow if user is admin OR if they're looking at their own profile
    if (loggedInUser.role === 'admin' || String(loggedInUser.id) === String(userId)) {
        return next(); // Allow access
    }

    // User is trying to see someone else's profile - not allowed
    return res.status(403).render('error', { 
        error: 'Access Denied',
        message: 'You can only view your own profile. Please log in with the correct account or contact an administrator.',
        showBackButton: true
    });
}

// Share these functions with other parts of our app
module.exports = {
    authenticateUser,
    authenticateJWT,
    authorizeAdmin,
    authorizeSelfOrAdmin,
}
