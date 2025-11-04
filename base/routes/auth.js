const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'users.json');

// Получить данные текущего пользователя
router.get('/user', async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const usersData = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Возвращаем только необходимые данные
        const userData = {
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            background: user.background,
            avatarFrame: user.avatarFrame,
            library: user.library || {
                reading: [],
                completed: [],
                planToRead: [],
                dropped: []
            }
        };

        res.json(userData);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
