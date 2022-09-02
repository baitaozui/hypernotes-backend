const express = require('express')

const app = express()

app.use(express.json())

let users = [
  {
    id: 1,
    username: "joey",
    display_name: "Joey",
    password: "1234",
    email: "a@b.com",
    groups: [
      1
    ]
  },
  {
    id: 2,
    username: "bob",
    display_name: "Bob",
    password: "1234",
    email: "a@b.com",
    groups: [
      1
    ]
  },
  {
    id: 3,
    username: "alice",
    display_name: "Alice",
    password: "1234",
    email: "a@b.com",
    groups: [
      2
    ]
  },
  {
    username: "pop",
    password: "9876",
    email: "",
    groups: "",
    display_name: "航",
    id: 6
  },
  {
    username: "12321",
    password: "111",
    email: "",
    groups: "",
    display_name: "lkj12",
    id: 7
  },
  {
    username: "a",
    password: "111",
    email: "",
    groups: "",
    display_name: "Abc",
    id: 8
  },
  {
    username: "w",
    password: "111",
    email: "",
    groups: "",
    display_name: "wer",
    id: 9
  }
]

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/users', (request, response) => {
  // console.log(request.headers);
  response.json(users)
})

app.get('/api/users/:id', (request, response) => {
  const id = Number(request.params.id)
  const user = users.find(user => user.id === id)
  if (user) {
    response.json(user)
  } else {
    response.statusMessage = `User Not Found (id: ${id})`
    response.status(404).end()
  }
})

app.delete('/api/users/:id', (request, response) => {
  const id = Number(request.params.id)
  users = users.filter(user => user.id !== id)

  response.status(204).end()
})

app.post('/api/users', (request, response) => {
  const body = request.body
  // 检验数据规范性
  if (!body.username || !body.password) {
    return response.status(400).json({ error: '用户信息不完整' })
  }

  const user = {
    ...body,
    groups: body.groups || [1],
    id: generateId()
  }
  users = users.concat(user)
  response.json(user)
})

const generateId = () => {
  const maxId = users.length > 0 ? Math.max(...users.map(user => user.id)) : 0
  return maxId + 1
}

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})