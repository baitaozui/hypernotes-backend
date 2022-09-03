require('dotenv').config()
const { request } = require('express')
const { response } = require('express')
// console.log(process.env.DATABASE_URL)
const express = require('express')
const { Sequelize, QueryTypes, DataTypes, Model } = require('sequelize')
const app = express()

const sequelize = new Sequelize(process.env.DATABASE_URL)
// 模型
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
  password: {
    type: DataTypes.STRING(30)
  }
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  modelName: 'user'
})

class Group extends Model { }
Group.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  underscored: true,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  modelName: 'group'
})

app.use(express.json())

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

// users
app.get('/api/users', async (request, response) => {
  const users = await User.findAll()
  response.json(users)
})

app.get('/api/users/:id', async (request, response) => {
  const id = Number(request.params.id)
  const user = await User.findOne({where:{id:id}})
  if (user) {
    response.json(user)
  } else {
    response.statusMessage = `User Not Found (id: ${id})`
    response.status(404).end()
  }
})

app.delete('/api/users/:id', async (request, response) => {
  const id = Number(request.params.id)
  User.destroy({
    where: {
      id: id
    }
  })

  response.status(204).end()
})

app.post('/api/users', async (request, response) => {
  const body = request.body
  // 检验数据规范性
  if (!body.name || !body.password) {
    return response.status(400).json({ error: '用户信息不完整' })
  }

  const user = await User.create(body)
  response.json(user)
})

// TODO update user
// app.put('/api/users/:id', async (request, response)=> {
//   response.status(200).end()
// })

const PORT = process.env.PORT || 3001
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate()
    console.log('成功连接数据库')
  } catch (error) {
    console.error('数据库连接失败:', error)
  }
  console.log(`Server running on port ${PORT}`)
})