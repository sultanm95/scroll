const fs = require('fs').promises;
const path = require('path');

async function updateUserLibrary(userId, type, data) {
    try {
        // Read the current users.json file
        const usersPath = path.join(__dirname, 'users.json');
        const usersContent = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(usersContent);

        // Find the user
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize library sections if they don't exist
        if (!user.library) {
            user.library = {
                favorites: [],
                reading: [],
                completed: [],
                planToRead: [],
                dropped: []
            };
        }

        if (type === 'favorites') {
            // Toggle favorite status
            const existingIndex = user.library.favorites.findIndex(m => m.id === data.mangaId);
            if (existingIndex > -1) {
                user.library.favorites.splice(existingIndex, 1);
            } else {
                user.library.favorites.push({
                    id: data.mangaId,
                    title: data.manga.title,
                    cover: data.manga.cover,
                    author: data.manga.author,
                    addedDate: data.manga.addedDate
                });
            }
        } else if (type === 'list') {
            // Remove from all list sections first
            ['reading', 'completed', 'planToRead', 'dropped'].forEach(section => {
                user.library[section] = user.library[section].filter(m => m.id !== data.mangaId);
            });

            // Add to the selected section
            user.library[data.status].push({
                id: data.mangaId,
                title: data.manga.title,
                cover: data.manga.cover,
                author: data.manga.author,
                addedDate: data.manga.addedDate,
                status: data.status
            });
        }

        // Save the updated users.json
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Error updating user library:', error);
        throw error;
    }
}

module.exports = updateUserLibrary;