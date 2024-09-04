const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Contact = sequelize.define('contact', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    linkedId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    linkPrecedence: {
        type: Sequelize.ENUM('primary', 'secondary'),
        allowNull: false,
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
});

module.exports = Contact;
