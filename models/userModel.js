// Import tools we need
const {query} = require("express");
const db = require("../services/database").config; // Connect to our MySQL database
const bcrypt = require("bcrypt"); // Tool to hide passwords safely

/**
 * Get all users from our database
 * Only shows users who haven't been deleted
 */
let getUsers = () => new Promise((resolve, reject) => {
    // Get all users that aren't deleted
    db.query('SELECT * FROM users WHERE deleted = 0', (err, users, fields) => {
        if(err){
            reject(err); // If error, tell us what went wrong
        } else {
            console.log(users); // Show users in console for debugging
            resolve(users); // Return the list of users
        }
    })
})

/**
 * Get one specific user by their ID number
 * Uses safe query to prevent hackers from breaking our database
 */
let getUser = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM `users` WHERE id = ? AND deleted = 0' , [id], (err, user, fields)=> {
        if(err){
            reject(err); // If error, tell us what went wrong
        } else {
            console.log(user); // Show user in console for debugging
            resolve(user); // Return the user (in an array)
        }
    })
})

/**
 * Create a new user account
 * Hides their password before saving it to the database
 */
let createUser = (userData) => new Promise(async(resolve, reject) => {
    // Hide the password so it's safe to store
    userData.password = await bcrypt.hash(userData.password, 10);
    
    // Build the SQL command to add the new user
    let sql = "INSERT INTO users (name, surname, email, info, password, profile_pic) VALUES (" +
        db.escape(userData.name) +        // Escape special characters for safety
        ", " + db.escape(userData.surname) +
        ", " + db.escape(userData.email) +
        ", " + db.escape(userData.info) +
        ", " + db.escape(userData.password) +
        ", " + db.escape(userData.profile_pic || null) + // Use null if no picture
        ")";

    console.log(sql); // Show the SQL command for debugging
    db.query(sql, function (err, result, fields) {
        if (err) {
            reject(err); // If error, tell us what went wrong
        } else {
            console.log(result.affectedRows + " row has been inserted"); // Success message
            resolve(userData); // Return the user data
        }
    })
})

/**
 * Update an existing user's information
 * Only hides the password if they're changing it
 */
let updateUser = (userData) => new Promise(async (resolve, reject) => {
    // List of fields we want to update (safely escaped)
    let updateFields = [
        "name = " + db.escape(userData.name),
        "surname = " + db.escape(userData.surname),
        "email = " + db.escape(userData.email),
        "info = " + db.escape(userData.info),
        "profile_pic = " + db.escape(userData.profile_pic)
    ];

    // Only hide the password if they're changing it (not already hidden)
    if (userData.password && userData.password.length < 60) { // Hidden passwords are 60+ characters
        userData.password = await bcrypt.hash(userData.password, 10);
        updateFields.push("password = " + db.escape(userData.password));
    }
    
    // Build the SQL command to update the user
    let sql = "UPDATE users SET " + updateFields.join(", ") +
        " WHERE id = " + db.escape(parseInt(userData.id));

    console.log(sql); // Show the SQL command for debugging
    db.query(sql, function(err, result) {
        if (err) {
            return reject(err); // If error, tell us what went wrong
        }
        resolve(userData); // Return the updated user data
    });
});

/**
 * Add a new user (alternative to createUser)
 * Hides password and saves user to database
 */
let addUser =(userData) => new Promise(async(resolve, reject) => {
    // Hide the password
    userData.password = await bcrypt.hash(userData.password, 10);
    
    // Build SQL command to add user
    let sql = "INSERT INTO users " +
        "( name, surname, email, info, password, profile_pic) " +
        "VALUES ("+  db.escape(userData.name) +
        ", " + db.escape(userData.surname) +
        ", " + db.escape(userData.email) +
        ", " + db.escape(userData.info) +
        ", " + db.escape(userData.password) +
        ", " + db.escape(userData.profile_pic || null) + " )"
    console.log(sql); // Show SQL command for debugging

    db.query(sql, (err, result) => {
        console.log('Model: db.query callback fired');
        if (err) {
            console.error('Model: db error', err);
            return reject(err); // If error, tell us what went wrong
        }
        console.log('Model: db success', result);
        resolve(userData); // Return the user data
    });
})

/**
 * Delete a user from the database
 * Can either completely remove them or just mark them as deleted
 */
let deleteUser = (id, deleteType) => new Promise((resolve, reject) => {
    if (deleteType === "hardDelete") {
        // Completely remove the user and all their data
        // First, remove their challenge progress
        let deleteProgressSQL = "DELETE FROM user_challenge_progress WHERE user_id = ?";
        db.query(deleteProgressSQL, [id], function(err) {
            if (err) return reject(err);
            
            // Then remove their chat messages
            let deleteMessagesSQL = "DELETE FROM messages WHERE user_id = ?";
            db.query(deleteMessagesSQL, [id], function(err) {
                if (err) return reject(err);
                
                // Then remove their badges
                let deleteBadgesSQL = "DELETE FROM users_badges WHERE user_id = ?";
                db.query(deleteBadgesSQL, [id], function(err) {
                    if (err) return reject(err);
                    
                    // Finally remove the user themselves
                    let deleteUserSQL = "DELETE FROM users WHERE id = ?";
                    db.query(deleteUserSQL, [id], function(err, result) {
                        if (err) return reject(err);
                        console.log(result.affectedRows + " user deleted");
                        resolve();
                    });
                });
            });
        });
    } else {
        // Just mark the user as deleted (they're still in database but hidden)
        let softDeleteSQL = "UPDATE users SET deleted = 1 WHERE id = ?";
        db.query(softDeleteSQL, [id], function(err, result) {
            if (err) return reject(err);
            console.log(result.affectedRows + " user soft deleted");
            resolve();
        });
    }
}); 

// Share all these functions with other parts of our app
module.exports = {
    getUsers,
    getUser,
    updateUser,
    addUser,
    deleteUser,
    createUser
}