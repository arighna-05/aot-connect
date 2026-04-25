const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

// Register
router.post("/register", async (req, res) => {
  const { email, username, fullName, password, role, department, year } = req.body;

  if (!email || !password || !username || !fullName) {
    return res.status(400).send("Missing required fields");
  }

  // Validate email domain
  if (!email.endsWith("@aot.edu.in") && email !== "admin@aot.edu.in") {
    return res.status(400).send("Invalid email domain. Must be @aot.edu.in");
  }

  try {
    const userExists = await db.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (userExists.rows.length > 0) {
      return res.status(400).send("Email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "u-" + Date.now();

    const newUser = await db.query(
      `INSERT INTO users (id, email, username, full_name, password_hash, role, department, year) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, email, username, fullName, hashedPassword, role || 'STUDENT', department, year]
    );

    const user = newUser.rows[0];
    const formattedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
      year: user.year,
      joinedCommunityIds: [],
      following: [],
      followers: [],
      interests: [],
      isVerified: false,
      isAnonymous: false
    };

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: formattedUser,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during registration");
  }
});

// Login
router.post("/login", async (req, res) => {
  const { loginId, password, role } = req.body;

  try {
    let userResult;
    let dbError = false;
    
    try {
      userResult = await db.query(
        "SELECT * FROM users WHERE (email = $1 OR username = $1) AND role = $2",
        [loginId, role]
      );
    } catch (dbErr) {
      console.error("Database connection failed:", dbErr.message);
      dbError = true;
    }

    let user;
    if (!userResult || userResult.rows.length === 0) {
      // Demo Fallback
      if (loginId === "student@aot.edu.in" && password === "password123" && role === "STUDENT") {
        user = {
          id: "u-demo-student",
          email: "student@aot.edu.in",
          username: "demo_student",
          fullName: "Demo Student",
          role: "STUDENT",
          department: "CSE",
          year: "4th Year",
          bio: "Passionate computer science student interested in web development and AI.",
          interests: ["Coding", "AI", "Gaming"],
          joined_community_ids: ["c-global", "c-tech", "c-culture"],
          following: ["u-demo-admin"],
          followers: [],
          is_verified: true
        };
      } else if (loginId === "admin@aot.edu.in" && password === "admin123" && role === "ADMIN") {
        user = {
          id: "u-demo-admin",
          email: "admin@aot.edu.in",
          username: "demo_admin",
          fullName: "Demo Admin",
          role: "ADMIN",
          bio: "System Administrator for AOT Connect.",
          interests: ["Management", "Networking"],
          joined_community_ids: ["c-global", "c-admin"],
          following: [],
          followers: ["u-demo-student"],
          is_verified: true
        };
      } else {
        const errorMsg = dbError 
          ? "The database is currently unreachable and these are not demo credentials." 
          : "Invalid email/username or password.";
        return res.status(401).send(errorMsg);
      }
    } else {
      user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).send("Invalid credentials");
      }
    }

    // Fetch user's additional network data if it's a real user (not demo)
    let joinedCommunityIds = user.joined_community_ids || [];
    let following = user.following || [];
    let followers = user.followers || [];

    if (!user.id.includes("demo") && !dbError) {
      try {
        const commResult = await db.query("SELECT community_id FROM community_members WHERE user_id = $1", [user.id]);
        joinedCommunityIds = commResult.rows.map(r => r.community_id);
        
        const followResult = await db.query("SELECT following_id FROM follows WHERE follower_id = $1", [user.id]);
        following = followResult.rows.map(r => r.following_id);
        
        const followerResult = await db.query("SELECT follower_id FROM follows WHERE following_id = $1", [user.id]);
        followers = followerResult.rows.map(r => r.follower_id);
      } catch (err) {
        console.error("Error fetching user network data:", err);
      }
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name || user.fullName,
      role: user.role,
      department: user.department,
      year: user.year,
      bio: user.bio,
      interests: user.interests || [],
      avatarUrl: user.avatar_url || user.avatarUrl,
      bannerUrl: user.banner_url || user.bannerUrl,
      isVerified: user.is_verified || user.isVerified || false,
      isAnonymous: user.is_anonymous || user.isAnonymous || false,
      joinedCommunityIds,
      following,
      followers
    };

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: formattedUser,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during login");
  }
});

module.exports = router;