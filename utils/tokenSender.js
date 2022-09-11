require('dotenv').config()
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

function tokenSender({ receiver = 'xiaohuabeta@gmail.com' }) {
  const port = process.env.PORT
  const sender = process.env.EMAIL_USERNAME
  const pass = process.env.EMAIL_PASSWORD

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: sender,
      pass: pass
    }
  });

  const token = jwt.sign({
    data: 'Token Data'
  }, 'secret', { expiresIn: '1h' }
  );

  const mailConfigurations = {
    from: sender,
    to: receiver,
    subject: '邮箱验证',
    text: `Hi! 
      Please follow the given link to verify your email
      http://localhost:${port}/verify/${token} 
      Thanks`
  };

  transporter.sendMail(mailConfigurations, function (error, info) {
    if (error) {
      console.log('邮件发送失败');
      console.error(error);
      return false;
    } else {
      console.log('邮件发送成功');
      console.log(info);
      return true;
    }
  });
}

module.exports = { tokenSender }