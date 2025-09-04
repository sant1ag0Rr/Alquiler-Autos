import User from "../../models/userModel.js";
import bcryptjs from "bcryptjs";
import Jwt from "jsonwebtoken";
import { errorHandler } from "../../utils/error.js";

const expireDate = new Date(Date.now() + 3600000);

export const vendorSignup = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = bcryptjs.hashSync(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            email,
            isVendor: true,
        });
        await user.save();
        res.status(200).json({ message: "Vendor created successfully" });
    } catch (error) {
        next(error);
    }
};

export const vendorSignin = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const validVendor = await User.findOne({ email }).lean();
        if (!validVendor || !validVendor.isVendor) {
            return next(errorHandler(404, "Vendor not found"));
        }
        const validPassword = bcryptjs.compareSync(password, validVendor.password);
        if (!validPassword) {
            return next(errorHandler(401, "Wrong credentials"));
        }
        
        const token = Jwt.sign({ id: validVendor._id }, process.env.ACCESS_TOKEN);
        const { password: _, ...rest } = validVendor; // Using _ to indicate intentionally unused variable
        
        const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
        res
            .cookie("access_token", token, {
                httpOnly: true,
                maxAge: thirtyDaysInMilliseconds,
            })
            .status(200)
            .json(rest);
    } catch (error) {
        next(error);
    }
};

export const vendorSignout = async (req, res, next) => {
    try {
        res
            .clearCookie("access_token")
            .status(200)
            .json({ message: "Vendor signed out successfully" });
    } catch (error) {
        next(error);
    }
};

export const vendorGoogle = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email }).lean();
        if (user && user.isVendor) {
            const { password: _, ...rest } = user;
            const token = Jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN);
            return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    expires: expireDate,
                })
                .status(200)
                .json(rest);
        }

        const generatedPassword = 
            Math.random().toString(36).slice(-8) +
            Math.random().toString(36).slice(-8);
        const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
        const newUser = new User({
            profilePicture: req.body.photo,
            password: hashedPassword,
            username:
                req.body.name.split(" ").join("").toLowerCase() +
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8),
            email: req.body.email,
            isVendor: true,
        });

        try {
            const savedUser = await newUser.save();
            const userObject = savedUser.toObject();
            const token = Jwt.sign({ id: savedUser._id }, process.env.ACCESS_TOKEN);
            const { password: _, ...rest } = userObject;
            
            return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    expires: expireDate,
                })
                .status(200)
                .json(rest);
        } catch (error) {
            if (error.code === 11000) {
                return next(errorHandler(409, "Email already in use"));
            }
            next(error);
        }
    } catch (error) {
        next(error);
    }
};