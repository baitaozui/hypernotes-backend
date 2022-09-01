const express = require('express')

const app = express()

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

app.get('/users', (request, response) => {
  response.json(users)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})