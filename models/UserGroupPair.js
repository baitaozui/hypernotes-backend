require('dotenv').config()

const { Sequelize, DataTypes, Model } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL)

class UserGroupPair extends Model { }
UserGroupPair.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userType: {
    type: DataTypes.STRING(30),
    allowNull: false
  }
}, {
  sequelize,
  underscored: true,
  timestamps: false,
  // 不使用 modelName 避免转义
  tableName: 'user_group'
})

module.exports = { UserGroupPair }