  const express = require('express');
  const app = express();
  const port = 5000;
  const bodyParser = require('body-parser');
  const jsonParser = bodyParser.json();
  const jwt = require('jsonwebtoken');
  const secret = 'Fullstacken-Login';
  const cors = require('cors');




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
        'INSERT INTO `users`(`id`, `idcard`, `fname`, `lname`, `email`, `pnumber`, `gender`, `date`, `password`, `hospital`, `vactype`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Default Hospital", "Default Vaccine")',
        [id, idcard, fname, lname, email, pnumber, gender, date, password],
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

            const response = {
              status: 'OK',
              message: 'SignUp Success',
              id: id
            };

            res.send(response);
          });
        }
      );
    });
  });


  // Sign in a user
  app.post('/SignIn', jsonParser, (req, res) => {
    const { email, password } = req.body;
    connection.execute(
      'SELECT * FROM `users` WHERE email = ? AND password = ?',
      [email, password],
      function(err, user, fields) {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        if (user.length == 0) {
          res.json({ status: 'error', message: 'Fail' });
          return;
        }
        const token = jwt.sign({ id: user[0].id, email: user[0].email }, secret, { expiresIn: '1h' });
        res.json({ status: 'ok', message: 'login success', token: token, id: user[0].id });
      }
    );
  });

  const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        res.json({ status: 'Error', message: err.message });
        return;
      }
      req.user = decoded;
      next();
    });
  };

  app.post('/authen', authenticateToken, (req, res) => {
    res.json({ status: 'OK', decoded: req.user });
  });

  /*app.post('/authen', jsonParser, (req, res) => {

    try {
      const token = req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token, secret);
    res.json({status: 'OK',decoded})
    } catch (err) {
      res.json({status: 'Error',message: err.message})
    }
  });*/




  app.get('/user', jsonParser, (req, res) => {
    connection.query(
      'SELECT * FROM users',
      function(err, results,fields){
        res.send(results)
      }
    )
  });


  // Get a user by ID
  app.get('/user/:id', jsonParser, (req, res) => {
    const userId = req.params.id;
    connection.execute(
      'SELECT * FROM `users` WHERE id = ?',
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





  app.delete('/user/delete/:id', jsonParser, (req, res) => {
    const userId = req.params.id;
    connection.execute(
      'DELETE FROM `users` WHERE id = ?',
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
      'UPDATE `users` SET id = ?, idcard = ?, fname = ?, lname = ?, email = ?, pnumber = ?, gender = ?, date = ?, password = ? WHERE id = ?',
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

  app.put('/user/update/:id', jsonParser, (req, res) => {
    const { id } = req.params;
    const { idcard, fname, lname, email, pnumber, gender, date, password } = req.body;

    connection.execute(
      'UPDATE `users` SET idcard = ?, fname = ?, lname = ?, email = ?, pnumber = ?, gender = ?, date = ?, password = ? WHERE id = ?',
      [idcard, fname, lname, email, pnumber, gender, date, password, id],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'User updated successfully' });
      }
    );
  });

  app.post('/ChooseHospital', authenticateToken, jsonParser, (req, res) => {
    const { hospitalId , vaccineId} = req.body;
    const userId = req.user.id;

    connection.execute(
      'UPDATE `users` SET hospital = ?, vactype = ?, WHERE id = ?',
      [hospitalId, vaccineId ,userId],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'Hospital selected successfully' });
      }
    );
  });


  app.get('/user/hospital/:id', jsonParser, (req, res) => {
    const userId = req.params.id;

    connection.execute(
      'SELECT v.hospital, h.label FROM `vaccine` AS v JOIN `hospital` AS h ON v.hospital = h.id WHERE v.id = ?',
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


  // Update a vaccine
  app.put('/vaccine/id/:id', jsonParser, (req, res) => {
    const vaccineId = req.params.id;
    const { id, hospital, vactype } = req.body;

    connection.execute(
      'UPDATE `users` SET id = ?, hospital = ?, vactype = ? WHERE id = ?',
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
      'UPDATE `users` SET hospital = ?, vactype = ? WHERE id = ?',
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

  app.put('/vaccine/both', jsonParser, (req, res) => {
    const vaccineId = req.params.id;
    const { hospital, vactype } = req.body;

    connection.execute(
      'UPDATE `vaccine` SET  hospital = ?, vactype = ? WHERE id = ?',
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

  app.put('/vaccine/hospital/:id', jsonParser, (req, res) => {
    const vaccineId = req.params.id;
    const { hospital } = req.body;

    connection.execute(
      'UPDATE `vaccine` SET hospital = ? WHERE id = ?',
      [hospital, vaccineId],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'Vaccine hospital updated successfully' });
      }
    );
  });

  app.put('/vaccine/id/:id', jsonParser, (req, res) => {
    const vaccineId = localStorage.getItem('id'); 
    const { hospital, vactype } = req.body;

    connection.execute(
      'UPDATE `vaccine` SET  hospital = ?, vactype = ? WHERE id = ?',
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



  app.put('/vaccine/vactype/:id', jsonParser, (req, res) => {
    const vaccineId = req.params.id;
    const { vactype } = req.body;

    connection.execute(
      'UPDATE `users` SET vactype = ? WHERE id = ?',
      [vactype, vaccineId],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'Vaccine hospital updated successfully' });
      }
    );
  });


  app.delete('/user/delete', jsonParser, (req, res) => {
    const { id } = req.body;

    connection.execute(
      'DELETE FROM `users` WHERE id = ?',
      [id],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'User deleted successfully' });
      }
    );
  });

  app.delete('/vaccine/delete', jsonParser, (req, res) => {
    const { id } = req.body;

    connection.execute(
      'DELETE FROM `users` WHERE id = ?',
      [id],
      (err, results, fields) => {
        if (err) {
          res.json({ status: 'error', message: err });
          return;
        }
        res.json({ status: 'OK', message: 'User deleted successfully' });
      }
    );
  });


  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });