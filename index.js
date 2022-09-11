require('dotenv').config()
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize')
const { User } = require('./models/User')
const { Group } = require('./models/Group')
const { UserGroupPair } = require('./models/UserGroupPair')
const svgCaptcha = require('svg-captcha');
const { tokenSender } = require('./utils/tokenSender')

const app = express()
const sequelize = new Sequelize(process.env.DATABASE_URL)

app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.json())

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

// 验证码
app.get('/captcha', function (req, res) {
  var captcha = svgCaptcha.create();
  res.status(200).send([captcha.data, captcha.text]);
});

// 返回随机字符串
app.get('/captcha/randomString', function (req, res) {
  res.status(200).send(svgCaptcha.randomText());
});

// 根据字符串返回一副验证码图片
app.get('/captcha/:text', function (req, res) {
  var text = req.params.text;
  var captcha = svgCaptcha(text);
  res.status(200).send(captcha);
});


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

// groups
app.get('/api/groups', async (request, response) => {
  const groups = await Group.findAll()
  response.json(groups)
})

app.get('/api/groups/:id', async (request, response) => {
  const id = Number(request.params.id)
  const group = await Group.findOne({ where: { id: id } })
  if (group) {
    response.json(group)
  } else {
    response.statusMessage = `Group Not Found (id: ${id})`
    response.status(404).end()
  }
})

// user_group
app.get('/api/user_group', async (request, response) => {
  const userGroupPair = await UserGroupPair.findAll()
  response.json(userGroupPair)
})

app.get('/api/user_group/:id', async (request, response) => {
  const id = Number(request.params.id)
  const userGroupPair = await UserGroupPair.findOne({ where: { id: id } })
  if (userGroupPair) {
    response.json(userGroupPair)
  } else {
    response.statusMessage = `UserGroupPair Not Found (id: ${id})`
    response.status(404).end()
  }
})

app.delete('/api/user_group/:userId/:groupId', async (request, response) => {
  const userId = Number(request.params.userId)
  const groupId = Number(request.params.groupId)
  UserGroupPair.destroy({
    where: {
      userId: userId,
      groupId: groupId
    }
  })

  response.status(204).end()
})

// 上传文件处理
app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || req.files.avatar === null) {
      res.status(204).send({
        status: false,
        message: 'No file uploaded'
      });
    } else {
      let avatar = req.files.avatar

      avatar.mv(`${__dirname}/uploaded/${avatar.name}`);

      res.send({
        status: true,
        message: 'File is uploaded',
        data: {
          name: avatar.name,
          mimetype: avatar.mimetype,
          size: avatar.size
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
})

// 邮箱验证
app.post('/send', (req, res) => {
  if (req.body && req.body.receiver) {
    const receiver = req.body.receiver;
    console.log(tokenSender(receiver));
  } else {
    res.status(204).end('信息不完整')
  }
})

app.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  jwt.verify(token, 'secret', function (err, decoded) {
    if (err) {
      console.log(err);
      res.send("验证失败");
    }
    else {
      res.send("验证成功");
    }
  });
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