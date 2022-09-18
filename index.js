require('dotenv').config()
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { Sequelize, Op } = require('sequelize')
const { User } = require('./models/User')
const { Group } = require('./models/Group')
const { UserGroupPair } = require('./models/UserGroupPair')
const svgCaptcha = require('svg-captcha');
const { tokenSender } = require('./utils/tokenSender');

const app = express()
const sequelize = new Sequelize(process.env.DATABASE_URL)

app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

// logger
// morgan.token('body', req => {
//   return JSON.stringify(req.body)
// })
// app.use(morgan('-:method :url :status :response-time ms - :res[content-length] \n--:body'))
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
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
// 获取所有用户
app.get('/api/users', async (req, res) => {
  const users = await User.findAll()
  res.json(users)
})

// 获取单个用户
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const user = await User.findOne({ where: { id: id } })
  if (user) {
    res.json(user)
  } else {
    res.statusMessage = `User Not Found (id: ${id})`
    res.status(404).end()
  }
})

// 删除用户
app.delete('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  User.destroy({
    where: {
      id: id
    }
  })

  res.status(204).end()
})

// 创建新用户
app.post('/api/users', async (req, res) => {
  const body = req.body
  // 检验数据规范性
  if (!body.name || !body.password) {
    return res.status(400).json({ error: '用户信息不完整' })
  }

  const user = await User.create(body)
  res.json(user)
})

// 更新用户信息
app.put('/api/users/:id', async (req, res) => {
  try {
    await User.update(req.body, { where: { id: req.params.id } })
    res.status(200).end()
  } catch (error) {
    res.status(400).end()
  }
})

// 获取一个用户所在的小组
app.get('/api/users/:id/groups', async (req, res) => {
  const id = req.params.id
  const [results, metadata] = await sequelize.query(
    `SELECT group_id FROM user_group p WHERE p.user_id = ${id}`
  );
  if (results.length > 0) {
    let groups = []
    for (let index = 0; index < results.length; index++) {
      const element = results[index];
      console.log('e:', element);
      const group = await Group.findOne({ where: { 'id': element.group_id } })
      groups.push(group)
    }
    res.send(groups)
  }
})

// groups
app.get('/api/groups', async (req, res) => {
  const searchObject = req.query;
  if (Object.keys(searchObject).length === 0) {
    // 无搜索值返回所有小组
    const groups = await Group.findAll()
    res.json(groups)
  } else {
    // 有搜索值返回搜索结果
    const searchValue = searchObject.value;
    const [results, metadata] = await sequelize.query(
      `SELECT * FROM groups WHERE CAST(id AS varchar) LIKE '%${searchValue}%' OR name LIKE '%${searchValue}%'`
    );
    res.send(results)
  }
})

app.get('/api/groups/:id', async (req, res) => {
  const id = Number(req.params.id)
  const group = await Group.findOne({ where: { id: id } })
  if (group) {
    res.json(group)
  } else {
    res.statusMessage = `Group Not Found (id: ${id})`
    res.status(404).end()
  }
})

// 创建小组
// {
//   "name": "汪汪队",
//   "description": "WoW"
// }
app.post('/api/groups', async (req, res) => {
  const body = req.body
  // 检验数据规范性
  if (!body.name || !body.description) {
    return res.status(400).json({ error: '小组信息不完整' })
  }
  const group = await Group.create(body)
  res.json(group)
})

// 删除小组
app.delete('/api/groups/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    // 清理user_group表
    UserGroupPair.destroy({ where: { groupId: id } })
    // 从groups表删除记录
    Group.destroy({ where: { id: id } })
    res.status(200).end()
  } catch (error) {
    res.status(500).end(error)
  }
})


// 获取一个小组的所有成员，包括权限信息
app.get('/api/groups/:id/members', async (req, res) => {
  const id = Number(req.params.id)
  const [results, metadata] = await sequelize.query(
    `SELECT user_id FROM user_group p,groups g WHERE p.group_id = g.id AND g.id = ${id}`
  );
  if (results.length > 0) {
    let members = []
    for (let index = 0; index < results.length; index++) {
      const element = results[index]
      const memberInfo = await User.findOne({ where: { 'id': element.user_id } })
      const memberType = await UserGroupPair.findOne({
        where: {
          'userId': element.user_id,
          'groupId': id
        },
        attributes: ['userType']
      })
      const member = { ...memberInfo.dataValues, ...memberType.dataValues }
      members.push(member)
    }
    res.send(members)
  }
})

// 加入新成员
app.post('/api/groups/:id/members/:user/:type', async (req, res) => {
  const groupId = Number(req.params.id)
  const userId = Number(req.params.user)
  const userType = req.params.type
  const newPair = {
    'userId': userId,
    'groupId': groupId,
    'userType': userType
  }
  const pairNotExist = pair => UserGroupPair.findOne({ where: { ...pair } }).then(result => result === null)
  try {
    await pairNotExist(newPair).then(async notExistFlag => {
      console.log(notExistFlag)
      if (notExistFlag) {
        const pair = await UserGroupPair.create(newPair)
        res.status(200).send(pair)
      } else {
        console.error(`用户(${userId})已存在于小组(${groupId})中`)
        res.status(400).end()
      }
    })
  } catch (error) {
    console.error(error);
    res.status(500).end()
  }

})

// 删除成员
// TODO 如果该成员是组长...
app.delete('/api/groups/:id/members/:user', async (req, res) => {
  const groupId = Number(req.params.id)
  const userId = Number(req.params.user)
  try {
    UserGroupPair.destroy({ where: { 'userId': userId, 'groupId': groupId } })
    res.status(200).end()
  } catch (error) {
    res.status(500).end()
  }
})


// user_group
app.get('/api/user_group', async (req, res) => {
  const userGroupPair = await UserGroupPair.findAll()
  res.json(userGroupPair)
})

app.get('/api/user_group/:id', async (req, res) => {
  const id = Number(req.params.id)
  const userGroupPair = await UserGroupPair.findOne({ where: { id: id } })
  if (userGroupPair) {
    res.json(userGroupPair)
  } else {
    res.statusMessage = `UserGroupPair Not Found (id: ${id})`
    res.status(404).end()
  }
})

app.delete('/api/user_group/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    UserGroupPair.destroy({
      where: { 'id': id }
    })
    res.status(200).end()
  } catch (error) {
    res.status(500).end()
  }
})

app.delete('/api/user_group/:userId/:groupId', async (req, res) => {
  const userId = Number(req.params.userId)
  const groupId = Number(req.params.groupId)
  UserGroupPair.destroy({
    where: {
      userId: userId,
      groupId: groupId
    }
  })

  res.status(204).end()
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
      const url = `http://localhost:3001/uploaded/${avatar.name}`;

      avatar.mv(`${__dirname}/uploaded/${avatar.name}`);


      res.send({
        status: true,
        message: '上传成功',
        data: {
          name: avatar.name,
          mimetype: avatar.mimetype,
          size: avatar.size,
          url: url
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
})

app.get('/uploaded/:filename', (req, res) => {
  const root = `${__dirname}/uploaded/`
  const filename = req.params.filename;
  res.sendFile(root + filename);
})

// 邮箱验证
app.post('/send', (req, res) => {
  if (req.body && req.body.receiver) {
    const receiver = req.body.receiver;
    console.log(tokenSender(receiver));
    res.status(200).end('成功发送')
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

// TODO annotations api


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