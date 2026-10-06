const bcrypt = require('bcrypt');
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');


const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        //kiem tra du lieu co day du khong

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Nhap thieu thong tin' });
        }

        //kiem tra user da ton tai chua
        const exitingUser = await User.findOne({ email });
        if (exitingUser) {
            return res.status(400).json({ message: 'Email da ton tai' })
        }
        //Hash  password

        const hashedPassword = await bcrypt.hash(password, 10);

        //tao user moi

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });


        //khong tra password cho client
        res.status(201).json({
            message: 'Dang ki thanh cong',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        //kiem tra du lieu

        if (!email || !password) {
            return res.status(400).json({
                message: 'Nhap thieu  thong tin'
            });
        }
        //tim user bang email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'User khong ton tai'
            });
        }
        //so sanh password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: 'Email hoac password khong dung'
            });
        }

        //tao JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        //Tra ket qua
        return res.status(200).json({
            message: 'Login thanh cong',
            token
        });


    } catch (error) {
        next(error);
    }
};


module.exports = {
    register,
    login
};
