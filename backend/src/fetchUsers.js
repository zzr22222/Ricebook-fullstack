const fetch = require('node-fetch');

async function fetchJSONPlaceholderUsers() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await response.json();
        return users.map(user => ({
            username: user.username,
            email: user.email,
            phone: user.phone,
            zipcode: user.address.zipcode,
            // 添加必要的字段
            salt: 'defaultSalt',
            hash: 'defaultHash',
            dob: '2000-01-01', // 默认生日，因为 JSONPlaceholder 没有这个字段
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

module.exports = fetchJSONPlaceholderUsers;