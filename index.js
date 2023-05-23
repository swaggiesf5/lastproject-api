const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const jwt = require('jsonwebtoken');
const secret = 'Fullstacken-Login';
const cors = require('cors')




require('dotenv').config();
const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL);
console.log('Connected to PlanetScale!');

app.use(cors())

// Sign up a new user
app.post('/SignUp', jsonParser, (req, res) => {
  const { id, idcard, fname, lname, email, pnumber, gender, date, password } = req.body;

  connection.beginTransaction((err) => {
    if (err) {
      res.json({ status: 'error', message: err });
      return;
    }

    connection.execute(
      'INSERT INTO `user`(`id`, `idcard`, `fname`, `lname`, `email`, `pnumber`, `gender`, `date`, `password`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, idcard, fname, lname, email, pnumber, gender, date, password],
      (err, results, fields) => {
        if (err) {
          connection.rollback(() => {
            res.json({ status: 'error', message: err });
          });
          return;
        }

        connection.execute(
          'INSERT INTO `vaccine`(`id`, `hospital`, `vactype`) VALUES (?, "Default Hospital", "Default Vaccine")',
          [id],
          (err, results, fields) => {
            if (err) {
              connection.rollback(() => {
                res.json({ status: 'error', message: err });
              });
              return;
            }

            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  res.json({ status: 'error', message: err });
                });
                return;
              }

              res.send({ status: 'OK' });
            });
          }
        );
      }
    );
  });
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

app.get('/user', jsonParser, (req, res) => {
  connection.query(
    'SELECT * FROM user',
    function(err, results,fields){
      res.send(results)
    }
  )
});


app.get('/vaccine', jsonParser, (req, res) => {
  connection.query(
    'SELECT * FROM vaccine',
    function(err, results,fields){
      res.send(results)
    }
  )
});
// Get a user by ID
app.get('/user/:id', jsonParser, (req, res) => {
  const userId = req.params.id;
  connection.execute(
    'SELECT * FROM `user` WHERE id = ?',
    [userId],
    function(err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.send(results);
    }
  );
});

// Get a vaccine by ID
app.get('/vaccine/:id', jsonParser, (req, res) => {
  const vaccineId = req.params.id;
  connection.execute(
    'SELECT * FROM `vaccine` WHERE id = ?',
    [vaccineId],
    function(err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.send(results);
    }
  );
});


app.delete('/user/:id', jsonParser, (req, res) => {
  const userId = req.params.id;
  connection.execute(
    'DELETE FROM `user` WHERE id = ?',
    [userId],
    function(err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'OK', message: 'User deleted successfully' });
    }
  );
});

// Update a user
app.put('/user/:id', jsonParser, (req, res) => {
  const userId = req.params.id;
  const { id, idcard, fname, lname, email, pnumber, gender, date, password } = req.body;

  connection.execute(
    'UPDATE `user` SET id = ?, idcard = ?, fname = ?, lname = ?, email = ?, pnumber = ?, gender = ?, date = ?, password = ? WHERE id = ?',
    [id, idcard, fname, lname, email, pnumber, gender, date, password, userId],
    (err, results, fields) => {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'OK', message: 'User updated successfully' });
    }
  );
});

// Delete a vaccine
app.delete('/vaccine/:id', jsonParser, (req, res) => {
  const vaccineId = req.params.id;
  connection.execute(
    'DELETE FROM `vaccine` WHERE id = ?',
    [vaccineId],
    function(err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'OK', message: 'Vaccine deleted successfully' });
    }
  );
});

// Update a vaccine
app.put('/vaccine/:id', jsonParser, (req, res) => {
  const vaccineId = req.params.id;
  const { id, hospital, vactype } = req.body;

  connection.execute(
    'UPDATE `vaccine` SET id = ?, hospital = ?, vactype = ? WHERE id = ?',
    [id, hospital, vactype, vaccineId],
    (err, results, fields) => {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'OK', message: 'Vaccine updated successfully' });
    }
  );
});

// Update a vaccine's hospital and vactype
app.put('/vaccine/:id', jsonParser, (req, res) => {
  const vaccineId = req.params.id;
  const { hospital, vactype } = req.body;

  connection.execute(
    'UPDATE `vaccine` SET hospital = ?, vactype = ? WHERE id = ?',
    [hospital, vactype, vaccineId],
    (err, results, fields) => {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      res.json({ status: 'OK', message: 'Vaccine updated successfully' });
    }
  );
});






app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
