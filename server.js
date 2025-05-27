const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const serviceAccount = require("./key.json"); 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});


app.post("/register", async (req, res) => {
    try {
        console.log("📥 Received registration request:", req.body);

        const { fullname, email, password, confirmpassword } = req.body;

        if (!fullname || !email || !password || !confirmpassword) {
            return res.status(400).json({ message: "⚠ All fields are required." });
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ message: "❌ Passwords do not match." });
        }


        const existingUser = await db.collection("users").where("email", "==", email).get();
        if (!existingUser.empty) {
            return res.status(400).json({ message: "❌ Email is already registered." });
        }

        await db.collection("users").add({
            fullname,
            email,
            password 
        });

        res.json({ message: "🎉 Registration Successful! Please login." });

    } catch (error) {
        console.error("🔥 Registration error:", error);
        res.status(500).json({ message: "⚠ Internal Server Error." });
    }
});



app.post("/login", async (req, res) => {
    try {
        console.log("📥 Login Request Received:", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "⚠ Please enter both Email and Password." });
        }

       
        const snapshot = await db.collection("users")
            .where("email", "==", email)
            .get();

        console.log("🔍 Firestore Query Result:", snapshot.docs.map(doc => doc.data())); 

        if (snapshot.empty) {
            return res.status(401).json({ message: "❌ No user found with this email." });
        }

        let userData;
        snapshot.forEach(doc => userData = doc.data());

        console.log("🔑 Stored Password in Firestore:", userData.password);
        console.log("🔑 Entered Password:", password);

        if (password === userData.password) { 
            res.json({ message: "🎉 Login Successful!" });
        } else {
            res.status(401).json({ message: "❌ Incorrect Password." });
        }

    } catch (error) {
        console.error("🔥 Login Error:", error);
        res.status(500).json({ message: "⚠ Internal Server Error." });
    }
});

app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
