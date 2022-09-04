require('dotenv').config()
const cors = require('cors')
// console.log(process.env.DATABASE_URL)
const express = require('express')
const { Sequelize, DataTypes, Model } = require('sequelize')
const { User } = require('./models/User')
const app = express()

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)
app.use(cors())

const sequelize = new Sequelize(process.env.DATABASE_URL)

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
  const user = await User.findOne({ where: { id: id } })
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

app.put('/api/users/:id', async (request, response) => {
  try {
    await User.update(request.body, { where: { id: request.params.id } })
    response.status(200).end()
  } catch (error) {
    response.status(400).end()
  }
})

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