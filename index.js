const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const jwt = require('jsonwebtoken');
const secret = 'Fullstacken-Login';
const cors = require('cors')

//kuy


require('dotenv').config();
const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL);
console.log('Connected to PlanetScale!');

app.use(cors())

// Sign up a new user
app.post('/SignUp', jsonParser, (req, res) => {
  const { id, idcard, fname, lname, email, pnumber, gender, date, password } = req.body;
  connection.execute(
    'INSERT INTO `user`(`id`, `idcard`, `fname`, `lname`, `email`, `pnumber`, `gender`, `date`, `password`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, idcard, fname, lname, email, pnumber, gender, date, password],
    function(err, results, fields) {
      if(err){
        res.json({status:'error', message: err});
        return;
      }
      res.send({status:'OK'});
    }
  );
});

// Sign in a user
app.post('/SignIn', jsonParser, (req, res) => {
  const { email, password } = req.body;
  connection.execute(
    'SELECT * FROM `user` WHERE email = ? AND password = ?',
    [email, password],
    function(err, user, fields) {
      if(err){
        res.json({status:'error', message: err});
        return;
      }
      if(user.length == 0){
        res.json({status:'error', message: 'Fail'});
        return;
      }
      const token = jwt.sign({ id: user[0].id, email: user[0].email }, secret,{ expiresIn: '1h'});
      res.json({status: 'ok', message: 'login sucess', token: token});
    }
  );
});

app.post('/authen', jsonParser, (req, res) => {

  try {
    const token = req.headers.authorization.split(' ')[1]
  var decoded = jwt.verify(token, secret);
  res.json({status: 'OK',decoded})
  } catch (err) {
    res.json({status: 'Error',message: err.message})
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
