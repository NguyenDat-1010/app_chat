const mongoose = require('mongoose');
const User = require('./models/User.js');

console.log('User model:', User);
console.log('User.create:', typeof User.create);

const testUser = async () => {
    try {
        //ket noi mongoDb
        await mongoose.connect('mongodb://127.0.0.1:27017/chatapp');
        console.log('Ket noi mongosd thanh cong');

        //Tao 1 user de email va id khong bi trung
        const id = Date.now();

        const user = await User.create({
            username: `user${id}`,
            email: `test${id}@gmail.com`,
            password: '123',
        });
        console.log('TAo user thanh cong');
        console.log(user);
    }
    catch (error) {
        console.error('Loi khi tao user: ', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Ngat ket noi DB');
    }
};

testUser();