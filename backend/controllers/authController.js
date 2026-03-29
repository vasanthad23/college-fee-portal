const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check email & password exist
        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password",
            });
        }

        // 2. Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        // 3. Compare password (IMPORTANT 🔥)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        // 4. Send token
        createSendToken(user, 200, res);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};