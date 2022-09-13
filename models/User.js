require('dotenv').config()

const { Sequelize, DataTypes, Model } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL)

class User extends Model { }
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  displayName: {
    type: DataTypes.STRING(30)
  },
  email: {
    type: DataTypes.STRING(30)
  },
  emailStatus: {
    type: DataTypes.BOOLEAN
  },
  password: {
    type: DataTypes.STRING(30)
  },
  bio: {
    type: DataTypes.TEXT
  },
  avatarUrl: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  modelName: 'user'
})

module.exports = {User}